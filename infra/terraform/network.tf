module "vpc" {
    source  = "terraform-google-modules/network/google"
    version = "~> 2.2"

    project_id   = module.project-factory.project_id
    network_name = "sbx-mousetrap"
    routing_mode = "GLOBAL"

    subnets = [
        {
            subnet_name           = "sbx-appengine"
            subnet_ip             = "10.10.10.0/24"
            subnet_region         = "us-east4"
        }
    ]

    secondary_ranges = {
        sbx-appengine = []
    }
}
