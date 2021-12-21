# ------- UN-COMMENT THE SERVICES YOU WANT TO TEST WITH THIS SERVICE ------- #

                  #   DONT UNCOMMENT YOUR OWN SERVICE HERE    #
# -------------------------------------------------------------------------- #          
          
# GATEWAY
kubectl -n rabbits apply -f https://raw.githubusercontent.com/DM885/GatewayService/main/deployment.yaml

# CRUD SERVICE
# kubectl -n rabbits apply -f https://raw.githubusercontent.com/DM885/CRUDservice/main/deployment.yaml

# SERVICE INFO SERVICE
# kubectl -n rabbits apply -f https://raw.githubusercontent.com/DM885/SolverInfoService/main/deployment.yaml

# AUTH SERVICE
# kubectl -n rabbits apply -f https://raw.githubusercontent.com/DM885/AuthenticationService/main/deployment.yaml

# LOGGING SERVICE
# kubectl -n rabbits apply -f https://raw.githubusercontent.com/DM885/LoggingService/main/deployment.yaml

# JOB SERVICE
# kubectl -n rabbits apply -f https://raw.githubusercontent.com/DM885/JobService/main/deployment.yaml

# MINIZINC SERVICE
# kubectl -n rabbits apply -f https://raw.githubusercontent.com/DM885/MiniZincService/main/deployment.yaml
