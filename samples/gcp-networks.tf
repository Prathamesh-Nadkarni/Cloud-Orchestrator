resource "google_compute_network" "production_network" {
  name                    = "prod-network"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "internal_subnet" {
  name          = "internal-subnet"
  ip_cidr_range = "10.0.1.0/24"
  region        = "us-central1"
  network       = google_compute_network.production_network.id
}

resource "google_compute_firewall" "allow_http" {
  name    = "allow-http"
  network = google_compute_network.production_network.name

  allow {
    protocol = "tcp"
    ports    = ["80", "8080"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["web"]
}

resource "google_compute_instance" "app_server" {
  name         = "app-server"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  tags = ["web"]

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-11"
    }
  }

  network_interface {
    network    = google_compute_network.production_network.name
    subnetwork = google_compute_subnetwork.internal_subnet.name
    
    access_config {
      // Ephemeral IP
    }
  }
}
