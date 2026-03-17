from openclaw import Claw
import sys

url = sys.argv[1]

claw = Claw()

data = claw.scrape(url)

print(data)