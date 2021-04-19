obtaining logs that dumps the HTTP request:

```
kubectl logs -n stub-http $(k get po -l app=stub-http -n stub-http -o jsonpath='{.items[0].metadata.name}') -c pyhttp -f --tail=100
```

interactive

```
kubectl exec -n stub-http -ti $(k get po -l app=stub-http -n stub-http -o jsonpath='{.items[0].metadata.name}') -c pyhttp -- sh
```

alias to apply configuration Map:

```
kup='kubectl apply -f stub-http.yml;kubectl rollout restart -n stub-http deploy stub-http;kubectl get po -n stub-http -w'
```

