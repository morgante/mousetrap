package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"cloud.google.com/go/pubsub"
)

// Global API clients used across function invocations.
var (
	pubsubClient *pubsub.Client
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

func handler(w http.ResponseWriter, r *http.Request) {
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

	message := &EventMessage{
		Session: b.Session,
		Data: EventData{
			Event: "entrypoint_finish",
			Ball:  b,
		},
	}

	data, err := json.Marshal(message)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	fmt.Fprintf(w, "Message %s!\n", data)

	t := pubsubClient.Topic(pubsubStateTopic)
	result := t.Publish(context.Background(), &pubsub.Message{
		Data: data,
	})

	log.Printf("Result: %v", result)

	fmt.Fprintf(w, "Started!\n")
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

	// Start HTTP server
	http.HandleFunc("/", handler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", port), nil))
}
