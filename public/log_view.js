async function getData(filepath) {
  return fetch(filepath).then(response => {
      if(!response.ok) throw new Error(response.statusText);
      return response.json();
  });
}

const tconv = t => new Date(t).getTime() * 0.001;
function treatData(data) {
    const keys = Object.keys(data);
    const res = {
        values: [],
        names: [],
        times_num: keys.map(t => new Date(t).getTime() * 0.001),
        times: keys.map(k => k.split(' ')[1]),
        time: null
    };
    if(keys.length == 0) {
        return res;
    }
    res.time = res.times[0];

    const first = data[keys[0]];
    const kv_map = [];
    for(const category in first) {
        const group = first[category];
        const keys = Object.keys(group);
        keys.sort();
        for(const instance of keys) {
            res.names.push(`${category}-${instance}`);
            kv_map.push({category, instance});
        }
    }
    res.values = kv_map.map(kv => {
        return keys.map(time => data[time][kv.category][kv.instance]);
    });
    return res;
}

function create(data) {
    const graph = document.getElementById('graph');

    const width = Math.max(document.body.clientWidth, 8 * data.times.length);
    const innerHeight = graph.clientHeight - 160;
    const margin = {
        top: 20,
        right: 1,
        bottom: 40,
        left: 120
    };

    const x = d3.scaleLinear()
        .domain([d3.min(data.times_num), d3.max(data.times_num) + 5])
        .rangeRound([ margin.left, width - margin.right ]);
    
    const x_str = d3.scaleBand()
        .domain(data.times)
        .range([ margin.left, width - margin.right ]);
    
    const y = d3.scaleBand()
        .domain(data.names)
        .rangeRound([ margin.top, margin.top + innerHeight ]);
    
    const xAxis = g => g
        .call(
            g => g.append("g").attr("transform", `translate(0,${margin.top})`)
                .call(
                    d3.axisTop()
                        .scale(x_str)
                        .tickValues(
                            x_str
                                .domain()
                                .filter((d,i) => !(i % 8))
                        ))
                        .call(g => g.select(".domain").remove()
                )
        )
        .call(
            g => g.append("g")
            .attr("transform", `translate(0,${innerHeight + margin.top + 4})`)
            .call(
                g => g.select(".tick text")
                    .clone()
                    .attr("dy", "2em")
                    .style("font-weight", "bold")
                    .text("ping")
            )
            .call(g => g.select(".domain").remove())
        );

    const yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickSize(0))
        .call(g => g.select(".domain").remove());
    
    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, innerHeight + margin.top + margin.bottom])
        .attr("font-family", "sans-serif")
        .attr("font-size", 10);
    
    svg.append("g")
        .call(xAxis);
    
    svg.append("g")
        .call(yAxis);
    
    svg.append("g")
        .selectAll("g")
        .data(data.values)
        .join("g")
        .attr("transform", (d, i) => `translate(0,${y(data.names[i])})`)
        .selectAll("rect")
        .data(d => d)
        .join("rect")
        .attr("x", (d, i) => x(data.times_num[i]) + 1)
        .attr("width", (d, i) => x(data.times_num[i] + 5) - x(data.times_num[i]))
        .attr("height", y.bandwidth() - 1)
        .attr("fill", d => d < 0 
            ? "#f00"
            : d == null
            ? 'transparent'
            : d < 1.5
                ? `rgb(${255 * (d - 0.5)},255.0,0.0)`
                : `rgb(255.0,255.0,0.0)`)
        .append("title")
        .text((d, i) => d < 0 ? 'dead' : `${d}ms`);
        // .text((d, i) => `${format(d)} per 100,000 people in ${data.times[i]}`);
    svg.node().style.width = width + margin.left + margin.right + 40;
    graph.appendChild(svg.node());
    graph.style.height = innerHeight + margin.top + margin.bottom;
}

document.addEventListener('DOMContentLoaded', async (e) => {
    const search = window
        .location
        .search || '';
    const queries = search
        .replace(/^\?/, '')
        .split('&')
        .reduce((res, query) => {
            const kv = query.split('=');
            res[kv[0]] = kv[1];
            return res;
        }, {});

    const fileurl = (queries['target'] || "logs/current.json");
    try {
        const raw_data = await getData(fileurl);
        const data = treatData(raw_data);
        console.log(data);
        create(data);
    } catch(err) {
        const graph = document.getElementById('graph');
        graph.innerHTML = `<p color="red">Error: ${err.toString()}</p>`;
    }
});

