


# Requirements

## data
This script uses Regards Citoyens's nos députés database dump.
This dump has to be loaded into a Mysql or MariaDB database.

There is a docker-compose.yaml, if one want to use docker to host a mariaDB instance.

## python

Python >3 mandatory.

The pymysql library is mandatory:
```bash
pip install -r requirements.txt
```

# Usage

```bash
python3  cosign.py
```

Will print some messages and finally output a json file into ../app/data/cosign.json
