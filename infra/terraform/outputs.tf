output "terraform_bucket" {
  value = module.project-factory.project_bucket_url
}

output "service_accounts" {
  value = module.service_accounts.emails
}

output "buckets" {
  value = module.gcs_buckets.names
}
