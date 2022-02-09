sleep 10
tmp=$(kubectl -n rabbits get pods 2>/dev/null |grep '0/1')
tmp2=$(kubectl get pods 2>/dev/null |grep '0/1')
while [ ! -z "$tmp" ] && [ ! -z "$tmp2" ]; do
    tmp=$(kubectl -n rabbits get pods 2>/dev/null |grep '0/1')
    tmp2=$(kubectl get pods 2>/dev/null |grep '0/1')
    sleep 10
done
