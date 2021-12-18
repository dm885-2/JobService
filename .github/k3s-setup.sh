# Bitnami helm charts
helm repo add bitnami https://charts.bitnami.com/bitnami

# Storage Class
kubectl apply -f https://raw.githubusercontent.com/DM885/RabbitMQK8S/main/rabbitmq-statefulset-sc.yaml

# # NAMESPACES
kubectl create ns rabbits

# MYSQL
kubectl apply -f https://raw.githubusercontent.com/DM885/MySQLK8S/main/mysql-secrets.yaml
kubectl -n rabbits apply -f https://raw.githubusercontent.com/DM885/MySQLK8S/main/mysql-secrets.yaml
kubectl -n rabbits apply -f https://raw.githubusercontent.com/DM885/MySQLK8S/main/auth-secrets.yaml
kubectl apply -f https://raw.githubusercontent.com/DM885/MySQLK8S/main/mysql-pv.yaml
kubectl apply -f https://raw.githubusercontent.com/DM885/MySQLK8S/main/mysql-pvc.yaml
helm install mysql -f https://raw.githubusercontent.com/DM885/MySQLK8S/main/mysql-values.yaml bitnami/mysql

# # RABBITMQ 
kubectl -n rabbits apply -f https://raw.githubusercontent.com/DM885/RabbitMQK8S/main/rabbit-rbac.yaml
kubectl -n rabbits apply -f https://raw.githubusercontent.com/DM885/RabbitMQK8S/main/rabbit-configmap.yaml
kubectl -n rabbits apply -f https://raw.githubusercontent.com/DM885/RabbitMQK8S/main/rabbit-secret.yaml
kubectl -n rabbits apply -f https://raw.githubusercontent.com/DM885/RabbitMQK8S/main/rabbit-statefulset.yaml
