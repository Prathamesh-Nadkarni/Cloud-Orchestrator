resource "aws_vpc" "production" {
  cidr_block = "10.0.0.0/16"
  tags = {
    Name = "prod-vpc"
  }
}

resource "aws_subnet" "frontend" {
  vpc_id     = aws_vpc.production.id
  cidr_block = "10.0.1.0/24"
  tags = {
    Name = "frontend-subnet"
  }
}

resource "aws_instance" "web_server" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.medium"
  subnet_id     = aws_subnet.frontend.id
  
  tags = {
    Role = "frontend"
  }
}

resource "aws_security_group" "web_sg" {
  name        = "web-sg"
  vpc_id      = aws_vpc.production.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
