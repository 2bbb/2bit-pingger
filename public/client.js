const socket = io.connect();

// 接続時の処理
socket.on('connect', () => {
    console.log('connect');
});

const $table = $('#results');
const create_table = (results) => {
    $table.empty();
    const categories = Object.keys(results);
    const table_contents = categories.map(key => {
        const instances = results[key];
        const instance_names = Object.keys(instances);
        const header = `
<tr>
    <th class="subhead" colspan="2">${key}</th>
    <th colspan="4">0-3</th>
    <th colspan="4">4-7</th>
    <th colspan="4">8-11</th>
    <th colspan="4">12-15</th>
    <th>last received</th>
</tr>`;
        const raws = instance_names.map(name => {
            return `<tr><th class="instance_name">${name}</th><td>[${instances[name].ip}]</td>`
                + instances[name].res.map((o, i) => `<td class="hb" id="${key}-${name}-${i}"></td>`)
                + `<td id="${key}-${name}-lastupdate">${instances[name].last_update}</td>`
                + `</tr>`;
        });
        return `<tbody>${header}${raws}</tbody>`;
    }).join('\n');
    const colgroup = `
<colgroup>
    <col span="2">
    <col span="4" class="span4e">
    <col span="4" class="span4o">
    <col span="4" class="span4e">
    <col span="4" class="span4o">
    <col>
</colgroup>`;
    $table.append(`${colgroup}${table_contents}`);
};

const update_table = (results) => {
    const categories = Object.keys(results);
    categories.forEach(key => {
        const instances = results[key];
        const instance_names = Object.keys(instances);
        instance_names.forEach(name => {
            $(`#${key}-${name}-lastupdate`).text(instances[name].last_update);
            instances[name].res.forEach((o, i) => {
                // const o = m.res;
                if(o == null || o.alive == null) return;
                const obj = $(`#${key}-${name}-${i}`);
                if(o.alive) {
                    // if(o.resp < 1.0) {
                    //     obj.css("background-color", "#0f0");
                    // } else {
                    //     obj.css("background-color", "#ff0");
                    // }
                    if(o.resp < 0.5) {
                        obj.css("background-color", "#0f0");
                    } else if(o.resp < 1.5) {
                        obj.css("background-color", `rgb(${255 * (o.resp - 0.5)},255.0,0.0)`);
                    } else {
                        obj.css("background-color", `rgb(255.0,255.0,0.0)`);
                    }
                    obj.text(`${o.resp}`.slice(0, 4) + 'ms');
                } else {
                    obj.css("background-color", "#f00");
                    obj.text("---");
                }
            });
        });
    });
};

socket.on("init", (results) => {
    create_table(results);
    update_table(results);
});
socket.on('ping', update_table);
