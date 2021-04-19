import json,sys
with open(sys.argv[1], "r") as f:
  dumps = json.load(f)
  if len(sys.argv) > 2:
    for k in sys.argv[2:]:
      k = int(k) if  k.isdigit() else k
      dumps = dumps[k]
  print(json.dumps(dumps,indent=2))

