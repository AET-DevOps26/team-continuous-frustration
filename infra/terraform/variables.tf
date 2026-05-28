variable "project_name" {
  description = "Project name used as prefix for Azure resources"
  type        = string
  default     = "team-continuous-frustration"
}

variable "resource_group_name" {
  description = "Azure resource group name"
  type        = string
  default     = "team-continuous-frustration-rg-tf"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "swedencentral"
}

variable "vm_name" {
  description = "Azure VM name"
  type        = string
  default     = "team-continuous-frustration-tf"
}

variable "vm_size" {
  description = "Azure VM size"
  type        = string
  default     = "Standard_D2s_v3"
}

variable "admin_username" {
  description = "Admin username for the VM"
  type        = string
  default     = "azureuser"
}

variable "public_key_path" {
  description = "Path to the SSH public key"
  type        = string
  default     = "~/.ssh/team-continuous-frustration-key.pub"
}

variable "ssh_source_address" {
  description = "Allowed source IP for SSH. Use your own IP for security, or * for demo."
  type        = string
  default     = "*"
}

variable "frontend_port" {
  description = "Frontend port"
  type        = string
  default     = "5173"
}

variable "backend_port" {
  description = "Backend port"
  type        = string
  default     = "8080"
}