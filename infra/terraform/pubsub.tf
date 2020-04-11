module "pubsub" {
  source  = "terraform-google-modules/pubsub/google"
  version = "~> 1.0"

  topic      = "ball-state"
  project_id = module.project-factory.project_id

  #   push_subscriptions = [
  #     {
  #       name                 = "push"   // required
  #       ack_deadline_seconds = 20 // optional
  #       push_endpoint        = "https://example.com" // required
  #       x-goog-version       = "v1beta1" // optional
  #     }
  #   ]
  pull_subscriptions = [
    {
      name                 = "debug" // required
      ack_deadline_seconds = 200     // optional
    }
  ]
  push_subscriptions = [
    {
      name                 = "app-engine",
      ack_deadline_seconds = 30,
      push_endpoint        = "https://clf-sbx-mousetrap.uk.r.appspot.com/pubsub/push?token=MUgKUc7D7FXEyUqzBDcfQwVYbPcupE"
    }
  ]
}

#  gcloud beta pubsub subscriptions create <your-subscription-name> \
#    --topic <your-topic-name> \
#    --push-endpoint \
#      https://<your-project-id>.appspot.com/pubsub/authenticated-push?token=<your-verification-token> \
#    --ack-deadline 30 \
#    --push-auth-service-account=[your-service-account-email] \
#    --push-auth-token-audience=example.com

module "pubsub-iam" {
  source  = "terraform-google-modules/iam/google//modules/pubsub_topics_iam"
  version = "~> 6.0"

  project       = module.project-factory.project_id
  pubsub_topics = [module.pubsub.topic]
  mode          = "additive"

  bindings = {
    "roles/pubsub.publisher" = [
      "serviceAccount:${module.service_accounts.emails["entrypoint"]}",
    ]
  }
}
