# @2bit/pingger

## install

```bash
npm i -g @2bit/pingger
```

## how to use

Please create `~/pingger-settings.json` referring to the following template.

(or run `pingger` and stop, then create template automatically, then you can edit this you like.)

```bash
pingger
```

## settings template

```json
{
    "port": 3000,
    "log_dir": "{USER_DIR}/pingger-logs",
    "settings": [
        {
            "category": "A",
            "instance": {
                "name1": "192.168.0.2",
                "name2": "192.168.0.3"
            }
        },
        {
            "category": "B",
            "instance": {
                "name3": "192.168.0.11"
            }
        },
        {
            "category": "wan",
            "instance": {
                "google-dns": "8.8.8.8"
            }
        }
    ]
}
```

## LICENSE

### d3.js

[ISC](https://github.com/d3/d3/blob/main/LICENSE)

### jQuery

[MIT](https://github.com/jquery/jquery/blob/main/LICENSE.txt)

### this repository

MIT

## Author

* 2bit [ ISHII 2bit Program Office / Haguki Wo Kamu To Ringo Kara Ti Ga Deru ]
