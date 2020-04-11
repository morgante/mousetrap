module "pubsub" {
    source  = "terraform-google-modules/pubsub/google"
    version = "~> 1.0"

    topic              = "ball-state"
    project_id         = module.project-factory.project_id

#   push_subscriptions = [
#     {
#       name                 = "push"   // required
#       ack_deadline_seconds = 20 // optional
#       push_endpoint        = "https://example.com" // required
#       x-goog-version       = "v1beta1" // optional
#     }
#   ]
#   pull_subscriptions = [
#     {
#       name                 = "pull" // required
#       ack_deadline_seconds = 20 // optional
#     }
#   ]
}

module "pubsub-iam" {
  source        = "terraform-google-modules/iam/google//modules/pubsub_topics_iam"
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
