# Bitnami helm charts
helm repo add bitnami https://charts.bitnami.com/bitnami

# Storage Class
curl -s -u Kaaasper:$1 https://api.github.com/repos/dm885-2/RabbitMQK8S/contents/rabbitmq-statefulset-sc.yaml |jq -r ".content" |base64 --decode | kubectl apply -f -

# # NAMESPACES
kubectl create ns rabbits

# MYSQL
curl -s -u Kaaasper:$1 https://api.github.com/repos/dm885-2/MySQLK8S/contents/mysql-secrets.yaml |jq -r ".content" |base64 --decode | kubectl apply -f -
curl -s -u Kaaasper:$1 https://api.github.com/repos/dm885-2/MySQLK8S/contents/mysql-secrets.yaml |jq -r ".content" |base64 --decode | kubectl -n rabbits apply -f -
curl -s -u Kaaasper:$1 https://api.github.com/repos/dm885-2/MySQLK8S/contents/auth-secrets.yaml |jq -r ".content" |base64 --decode | kubectl -n rabbits apply -f -
curl -s -u Kaaasper:$1 https://api.github.com/repos/dm885-2/MySQLK8S/contents/mysql-pv.yaml |jq -r ".content" |base64 --decode | kubectl apply -f -
curl -s -u Kaaasper:$1 https://api.github.com/repos/dm885-2/MySQLK8S/contents/mysql-pvc.yaml |jq -r ".content" |base64 --decode | kubectl apply -f -

curl -s -u Kaaasper:$1 https://api.github.com/repos/dm885-2/MySQLK8S/contents/mysql-values.yaml |jq -r ".content" |base64 --decode > tmp1
helm install mysql -f tmp1 bitnami/mysql

# # RABBITMQ 
curl -s -u Kaaasper:$1 https://api.github.com/repos/dm885-2/RabbitMQK8S/contents/rabbit-rbac.yaml |jq -r ".content" |base64 --decode | kubectl -n rabbits apply -f -
curl -s -u Kaaasper:$1 https://api.github.com/repos/dm885-2/RabbitMQK8S/contents/rabbit-configmap.yaml |jq -r ".content" |base64 --decode | kubectl -n rabbits apply -f -
curl -s -u Kaaasper:$1 https://api.github.com/repos/dm885-2/RabbitMQK8S/contents/rabbit-secret.yaml |jq -r ".content" |base64 --decode | kubectl -n rabbits apply -f -
curl -s -u Kaaasper:$1 https://api.github.com/repos/dm885-2/RabbitMQK8S/contents/rabbit-statefulset.yaml |jq -r ".content" |base64 --decode | kubectl -n rabbits apply -f -