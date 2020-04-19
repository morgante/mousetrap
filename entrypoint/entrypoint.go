package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"cloud.google.com/go/pubsub"
)

// Global API clients used across function invocations.
var (
	pubsubClient *pubsub.Client
	jobs         chan Ball
)

const pubsubStateTopic = "ball-state"

type Ball struct {
	Session string `json:"session"`
	ID      string `json:"id"`
	Color   string `json:"color"`
}

type EventData struct {
	Event string `json:"event"`
	Ball  Ball   `json:"ball"`
}

type EventMessage struct {
	Session string    `json:"session"`
	Data    EventData `json:"data"`
}

func sendEvent(message *EventMessage) (encoded []byte, err error) {
	data, err := json.Marshal(message)
	if err != nil {
		return nil, err
	}

	t := pubsubClient.Topic(pubsubStateTopic)
	t.Publish(context.Background(), &pubsub.Message{
		Data: data,
	})

	return data, nil
}

func worker(jobs <-chan Ball) {
	fmt.Println("Register the worker")

	for b := range jobs {
		msg, err := sendEvent(&EventMessage{
			Session: b.Session,
			Data: EventData{
				Event: "entrypoint_done",
				Ball:  b,
			},
		})
		if err != nil {
			fmt.Println(err.Error())
			continue
		}
		fmt.Printf("Processing %v\n", b)
		fmt.Printf("Sent %s\n", msg)
	}
}

func handler(w http.ResponseWriter, r *http.Request) {
	// Allow CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
	if r.Method == "OPTIONS" {
		return
	}

	log.Print("Entrypoint received a request.")

	// Declare a new Person struct.
	var b Ball

	// Try to decode the request body into the struct. If there is an error,
	// respond to the client with the error message and a 400 status code.
	err := json.NewDecoder(r.Body).Decode(&b)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	startData, err := sendEvent(&EventMessage{
		Session: b.Session,
		Data: EventData{
			Event: "entrypoint_start",
			Ball:  b,
		},
	})

	fmt.Printf("Start timer for %v\n", b)
	ballTimer := time.NewTimer(time.Second * 2)
	go func() {
		<-ballTimer.C
		fmt.Printf("Timer fired for %v\n", b)
		jobs <- b
	}()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(startData)
}

func main() {
	log.Print("Entrypoint started.")

	// Declare a separate err variable to avoid shadowing the client variables.
	var initErr error

	// Sets your Google Cloud Platform project ID.
	projectID := "clf-sbx-mousetrap"

	// Creates a client.
	ctx := context.Background()
	pubsubClient, initErr = pubsub.NewClient(ctx, projectID)
	if initErr != nil {
		log.Fatalf("Failed to create client: %v", initErr)
	}

	// Create the jobs worker
	jobs = make(chan Ball, 100)
	go worker(jobs)

	// Start HTTP server
	http.HandleFunc("/", handler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", port), nil))
}
