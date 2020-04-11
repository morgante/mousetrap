terraform {
  backend "gcs" {
    bucket  = "mousetrap-tfstate"
    prefix  = "terraform/state"
  }
}
