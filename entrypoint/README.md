
## Local Development
Build and start the server:
```
make run
```

Submit a request:
```
ENDPOINT=localhost:8080
curl -H "Content-Type: application/json" -i --data @sample_request.json "${ENDPOINT}"
```

## Remote Testing