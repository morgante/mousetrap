package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path"
	"time"

	"cloud.google.com/go/pubsub"
	"cloud.google.com/go/storage"
)

// Global API clients used across function invocations.
var (
	pubsubClient  *pubsub.Client
	storageClient *storage.Client
	bucketName    string
	jobs          chan Ball
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

func writeBall(b *Ball) error {
	data, err := json.Marshal(b)
	if err != nil {
		return err
	}

	ctx := context.Background()
	ctx, cancel := context.WithTimeout(ctx, time.Second*50)
	defer cancel()

	objectName := path.Join("sessions", b.Session, "balls", b.ID+".json")

	wc := storageClient.Bucket(bucketName).Object(objectName).NewWriter(ctx)
	if _, err = wc.Write(data); err != nil {
		return err
	}

	if err := wc.Close(); err != nil {
		return err
	}
	return nil
}

func worker(balls <-chan Ball) {
	fmt.Println("Register the worker")

	for b := range balls {
		fmt.Printf("Processing %v\n", b)

		err := writeBall(&b)
		if err != nil {
			fmt.Println(err.Error())
			continue
		}

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

	fmt.Printf("Start upload for %v\n", b)
	jobs <- b
	// ballTimer := time.NewTimer(time.Second * 2)
	// go func() {
	// 	<-ballTimer.C
	// 	fmt.Printf("Timer fired for %v\n", b)
	// 	jobs <- b
	// }()

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
	bucketName = "mousetrap-us-gateway"

	// Creates a pubsub client.
	ctx := context.Background()
	pubsubClient, initErr = pubsub.NewClient(ctx, projectID)
	if initErr != nil {
		log.Fatalf("Failed to create pubsub client: %v", initErr)
	}

	storageClient, initErr = storage.NewClient(ctx)
	if initErr != nil {
		log.Fatalf("Failed to create storage client: %v", initErr)
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
