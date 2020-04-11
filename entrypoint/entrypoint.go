package main

import (
	"context"
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

func handler(w http.ResponseWriter, r *http.Request) {
	log.Print("Entrypoint received a request.")

	t := pubsubClient.Topic(pubsubStateTopic)
	result := t.Publish(context.Background(), &pubsub.Message{
		Data: []byte("Hello world!"),
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
