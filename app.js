document.ready = new Promise(
    (resolve) => document.addEventListener('DOMContentLoaded', resolve)
)

const default_playbook_list = [
    "./playbooks/the-spellslinger.json",
]

const load_sheets = async (playbook_urls=undefined) => {
    if (playbook_urls === undefined) {
        playbook_urls = default_playbook_list
    }
    const fetches = playbook_urls.map(url => 
        fetch(url).then(response => response.json())
    )
    const playbook_list = await Promise.all(fetches);
    const playbooks = {};
    for (let playbook of playbook_list) {
        playbooks[playbook.name] = playbook;
    }
    return playbooks;
}

const new_hunter = () => {
    const sheet_div = document.getElementById('sheet');
    const sheets = document.sheets;
    const playbook_select = document.createElement('div');
    sheet_div.appendChild(playbook_select);
    playbook_select.id = 'playbook-select';
    for (let [name, pb] of Object.entries(sheets)) {
        console.log(name, pb);
        playbook_select.insertAdjacentHTML('beforeend', 
            `<div data-playbook="${name}" class="select-button" id="${pb.id}">
                <img src="${pb.icon}" class="icon" /> ${name}
            </div>`
        );
        const pb_div = document.getElementById(pb.id);
        pb_div.addEventListener('click', () => {
            console.log('clicked', name);
            const new_sheet = new_sheet(name);
            sheet_div.appendChild(new_sheet);
            sheet_div.removeChild(playbook_select);
        });
    }
}


(async function main() {
    await document.ready;
    const sheet_div = document.getElementById('sheet');
    const sheets = await load_sheets();
    document.sheets = sheets;
    console.log(sheets);
    const hunter_select = document.createElement('div');
    sheet_div.appendChild(hunter_select);
    hunter_select.id = 'hunter-select';
    hunter_select.insertAdjacentHTML('beforeend', 
        `<div class="select-button" id="new-hunter">➕ New Hunter</div>`
    );
    const new_hunter_div = document.getElementById('new-hunter');
    new_hunter_div.addEventListener('click', () => {
        sheet_div.removeChild(hunter_select);
        new_hunter();
    });
})()
