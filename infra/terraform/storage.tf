module "gcs_buckets" {
  source          = "terraform-google-modules/cloud-storage/google"
  version         = "~> 1.4"
  project_id      = module.project-factory.project_id
  names           = ["public"]
  prefix          = "mousetrap"
  location        = "US"
  set_admin_roles = false
}
