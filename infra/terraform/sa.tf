module "service_accounts" {
  source  = "terraform-google-modules/service-accounts/google"
  version = "~> 2.0"

  project_id = module.project-factory.project_id
  prefix     = ""

  names = ["entrypoint"]
  #   project_roles = [
  #     "project-foo=>roles/viewer",
  #     "project-spam=>roles/storage.objectViewer",
  #   ]
}
