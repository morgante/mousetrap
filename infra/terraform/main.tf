
module "project-factory" {
    source  = "terraform-google-modules/project-factory/google"
    version = "~> 7.1"

    name                = "clf-sbx-mousetrap"
    bucket_project      = "clf-sbx-mousetrap"
    bucket_name         = "mousetrap-tfstate"

    org_id              = var.organization_id
    folder_id           = var.folder_id
    billing_account     = var.billing_account
}
