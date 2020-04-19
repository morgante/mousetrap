module "gcs_buckets" {
  source = "/Users/morgantep/code/google/foundation/modules/storage"
  # source          = "terraform-google-modules/cloud-storage/google"
  # version         = "~> 1.4"

  project_id      = module.project-factory.project_id
  names           = ["public", "gateway"]
  prefix          = "mousetrap"
  location        = "US"
  set_admin_roles = false
  pubsub_topics   = {
    gateway = "projects/${module.project-factory.project_id}/topics/${module.pubsub.topic}"
  }
}
