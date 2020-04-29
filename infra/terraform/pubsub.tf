module "pubsub" {
  source  = "terraform-google-modules/pubsub/google"
  version = "~> 1.0"

  topic      = "ball-state"
  project_id = module.project-factory.project_id

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
