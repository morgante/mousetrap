variable "organization_id" {
    type = string
    description = "GCP org ID"
}

variable "folder_id" {
    type = string
    description = "GCP folder to nest project in"
}

variable "billing_account" {
    type = string
    description = "GCP Billing Account"
}
