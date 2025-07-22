#!/bin/bash
curl -X POST http://localhost:3001/api/templates -H "Content-Type: application/json" -d '{"name":"Test","content":"Hello world","category":"test"}'