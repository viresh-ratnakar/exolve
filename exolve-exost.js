/*
MIT License
      
Copyright (c) 2025 Viresh Ratnakar
    
See the full license notice in exolve-m.js.
*/  

/**
 * Library for setting up client UI for Exost crossword hosting at:
 *
 *   https://xlufz.ratnakar.org/exost.html
 *
 * The main two functions are requestPwd() and uploadExolve(). These are
 * used from Exolve Player as well as Exet.
 *
 * This library is also used from the Exost site. There, apert from the above,
 * there is additionally a management interface for viewing all your crosswords
 * and possibly deleting specific crosswords. Further, it supports reading
 * puz/ipuz/exolve files (which also works in Exolve Player, but only needs
 * to use uploadExolve() from there). For reading from files, apart from
 * passing a config entry for uploadFileEltId, you should have script tags in
 * your HTML * file that load exolve-from-{puz,ipuz}.js.
 */
class ExolveExost {
  /**
   * Config fields: {
   *   // Required:
   *   exostURL: 'https://xlufz.ratnakar.org/exost.html',
   *   apiServer: 'https://xlufz.ratnakar.org/exost.php',
   *   emailEltId: 'xst-email',
   *   pwdEltId: 'xst-pwd',
   *   pwdStatusEltId: 'xst-pwd-status',
   *   uploadStatusEltId: 'xst-upload-status',
   *
   *   // Optional:
   *   listEltId: 'xst-list',
   *   listContainerEltId: 'xst-list-container',
   *   listStatusEltId: 'xst-list-status',
   *   uploadFileEltId: 'xst-upload-file',
   *   tempEltId: 'xst-temp-xlv',
   *   uploadCallback: 1-arg callback function,
   *   varName: 'exost'  // name of global ExolveExost var (assumed to be 'exost' if missing)
   * }
   */
  constructor(config) {
    this.exostURL = config.exostURL;
    this.apiServer = config.apiServer;
    this.emailElt = document.getElementById(config.emailEltId);
    this.pwdElt = document.getElementById(config.pwdEltId);
    this.pwdStatusElt = document.getElementById(config.pwdStatusEltId);
    this.uploadStatusElt = document.getElementById(config.uploadStatusEltId);
    if (!this.exostURL || !this.apiServer ||
        !this.emailElt || !this.pwdElt || !this.pwdStatusElt ||
        !this.uploadStatusElt) {
      this.showError("Invalid ExolveExost config");
      return;
    }
    this.varName = config.varName ?? 'exost';

    this.listElt = document.getElementById(config.listEltId) ?? null;
    this.listContainerElt = document.getElementById(config.listContainerEltId) ?? null;
    this.listStatusElt = document.getElementById(config.listStatusEltId) ?? null;

    this.uploadFileElt = document.getElementById(config.uploadFileEltId) ?? null;
    this.uploadCallback = config.uploadCallback ?? null;
    this.tempEltId = config.tempEltId ?? '';
    this.tempElt = this.tempEltId ?
      (document.getElementById(this.tempEltId) ?? null) : null;

    this.uploadFileName = '';
    this.uploadData = '';
  }

  showError(msg) {
    console.log('showError: ' + msg);
    alert(msg);
  }

  requestPwd() {
    const email = this.emailElt.value.trim();
    if (!email) {
      this.showError("Email missing");
      return;
    }

    const formData = new FormData();
    formData.append('op', 'auth');
    formData.append('email', email);

    fetch(this.apiServer, { method: 'POST', body: formData })
    .then(r => r.json())
    .then(data => {
      if (data.error) {
        console.log(data);
        this.showError("Error from 'auth': " + data.error);
      } else {
        console.log(data);
        const sentDate = data.sent ? new Date(data.sent * 1000) : new Date();
        this.pwdStatusElt.innerHTML =
          (data.throttled ?
            'Please wait, emailed recently at ' : 'Emailed at ') +
          (sentDate).toLocaleString();
      }
    })
    .catch(e => this.showError("Error in fetch/auth: " + e.message));
  }

  fetchList() {
    if (!this.listElt || !this.listContainerElt || !this.listStatusElt) {
      return;  /** unsuported */
    }
    const email = this.emailElt.value.trim();
    const pwd = this.pwdElt.value.trim();
    if (!email || !pwd) {
      this.showError("Email or password missing");
      return;
    }

    const formData = new FormData();
    formData.append('op', 'list');
    formData.append('email', email);
    formData.append('pwd', pwd);

    fetch(this.apiServer, { method: 'POST', body: formData })
    .then(r => r.json())
    .then(data => {
      if (data.error) {
        this.showError("Error from 'list': " + data.error);
      } else {
        this.renderList(data);
        this.listStatusElt.innerHTML =
          'Last refreshed: ' + (new Date()).toLocaleString();
      }
    })
    .catch(e => this.showError("Error in fetch/list: " + e.message));
  }

  /**
   * Helper used by fetchList().
   */
  renderList(items) {
    this.listElt.innerHTML = '';
    this.listContainerElt.style.display = 'block';

    if (items.length === 0) {
      this.listElt.innerHTML = '<p>No crosswords found.</p>';
      return;
    }
    // Create table structure for better data display
    const table = document.createElement('table');
    table.className = 'xst-url-list';
    table.innerHTML = `
      <style>
        .xst-url-list {
          width: 100%;
          border-collapse: collapse;
        }
        .xst-url-list tr {
          border-bottom: 1px solid #aaa;
        }
        .xst-url-list th {
          text-align: left;
        }
        .xst-url-list td,
        .xst-url-list th {
          vertical-align: top;
        }
        .xst-small {
          font-size: 80%;
        }
      </style>
      <tr>
        <th>ID</th>
        <th>Title</th>
        <th>Copy URL/Embed, Delete</th>
        <th>KB</th>
        <th>Created, Updated</th>
      </tr>
    `;

    const randId = 'xstid-' + Math.random().toString(36).substring(3, 9);
    let ctr = 0;

    items.forEach(item => {
      const tr = document.createElement('tr');

      // Format size
      const sizeKB = (item.size / 1024).toFixed(1);
      // Format Date (simplified)
      const createdStr = new Date(item.created).toLocaleString();
      const updatedStr = new Date(item.updated).toLocaleString();
      const crup = createdStr +
        (createdStr == updatedStr ? '' : '<br>' + updatedStr);

      ctr += 1;
      const idBase = randId + '-' + ctr;

      tr.innerHTML = `
        <td>
          <a href="${item.url}" target="_blank">${item.id}</a>
        </td>
        <td>${item.title}</td>
        <td>
          <button id="${idBase}-u"
            onclick="${this.varName}.copyURL('${item.url}', false, '${idBase}-u')"
            title="Copy crossword URL">&#128279;</button>
          <button id="${idBase}-e"
            onclick="${this.varName}.copyURL('${item.url}', true, '${idBase}-e')"
            title="Copy crossword iframe embed code">&lt;/&gt;</button>
          <button onclick="${this.varName}.deleteCrossword('${item.id}')"
            title="Delete crossword">&#128465;</button>
        </td>
        <td>${sizeKB}</td>
        <td class="xst-small">${crup}</td>
      `;
      table.appendChild(tr);
    });

    this.listElt.appendChild(table);
  }

  deleteCrossword(id) {
    const email = this.emailElt.value.trim();
    const pwd = this.pwdElt.value.trim();
    if (!email || !pwd) {
      this.showError("Email or password missing");
      return;
    }
    if (!confirm(`Are you sure you want to delete puzzle "${id}"?`)) {
      return;
    }
    const formData = new FormData();
    formData.append('op', 'delete');
    formData.append('email', email);
    formData.append('pwd', pwd);
    formData.append('id', id);

    fetch(this.apiServer, { method: 'POST', body: formData })
    .then(r => r.json())
    .then(data => {
      if (data.error) {
        this.showError("Error from 'delete': " + data.error);
      } else {
        this.fetchList();
      }
    })
    .catch(e => this.showError("Error in fetch/delete: " + e.message));
  }

  /**
   * Convenience function to convert a puzzle URL to an iframe embed code.
   */
  iframeEmbed(url) {
    return `
    <iframe height="780px" width="100%" allowfullscreen="true"
      style="border:none; width: 100% !important; position: static;display: block !important; margin: 0 !important;"
      src="${url}">
    </iframe>
    `;
  }

  /**
   * Convenience function to copy a URL or iframe embed code to the clipboard.
   */
  copyURL(url, embed, eltId=null) {
    const text = embed ? this.iframeEmbed(url) : url;
    navigator.clipboard.writeText(text);
    if (eltId) {
      const elt = document.getElementById(eltId);
      if (elt) {
        const saved = elt.innerHTML;
        elt.innerHTML = '&#128203;';
        elt.disabled = true;
        setTimeout(() => {
          elt.innerHTML = saved;
          elt.disabled = false;
        }, 1000);
      }
    }
  }

  upload() {
    if (!this.uploadStatusElt) {
      return;  /** unsuported */
    }
    if (!this.uploadData) {
      this.showError("No valid crossword data has been set");
      return;
    }
    const email = this.emailElt.value.trim();
    const pwd = this.pwdElt.value.trim();
    if (!email || !pwd) {
      this.showError("Email or password missing");
      return;
    }
    const formData = new FormData();
    formData.append('op', 'upload');
    formData.append('email', email);
    formData.append('pwd', pwd);
    formData.append('data', this.uploadData);

    fetch(this.apiServer, { method: 'POST', body: formData })
    .then(r => r.json()) // Expect JSON now
    .then(data => {
      if(data.error) {
        this.showError("Error from 'upload': " + data.error);
      } else {
        if (this.uploadCallback) {
          this.uploadCallback(data);
        }
        this.fetchList();
        this.uploadStatusElt.innerHTML = 'Uploaded at: ' +
          (new Date()).toLocaleString();
      }
    })
    .catch(e => this.showError("Error in fetch/upload: " + e.message));
  }

  /**
   * Pass a rendered puzzle if one already exists.
   */
  uploadExolve(specs, puz=null) {
    if (!this.setExolve(specs, puz)) {
      this.showError("Invalid Exolve data");
      return;
    }
    this.upload();
  }

  idGoodForExost(id) {
    const regex = /^[a-zA-Z0-9_-]+$/;
    return regex.test(id);
  }

  makeIdGoodForExost(specs, id) {
    const safeSet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-";
    const regex = /[a-zA-Z0-9_-]/;
    const dashRegex = /[ ()!@#$%^&*+~`=]/;
    const goodId = id.split('').map(ch => {
      if (regex.test(ch)) return ch;
      if (dashRegex.test(ch)) return '-';
      const index = ch.charCodeAt(0) % 64;
      return safeSet[index];
    }).join('');
    return specs.replace(
        /^\s*exolve-id:.*$/m, '  exolve-id: ' + goodId);
  }

  /**
   * Pass puz as non-NULL if you already have it rendered.
   */
  setExolve(specs, puz=null) {
    let start = specs.indexOf('exolve-begin')
    let end = specs.indexOf('exolve-end')
    if (start < 0 || end < 0 || start >= end) {
      return false;
    }
    while (start > 0 && specs.charAt(start - 1) == ' ') {
      start--;
    }
    const dataSansEnd = specs.substring(start, end);

    let idFromPuz = '';
    if (puz) {
      idFromPuz = puz.id;
    } else {
      if (!this.tempElt) {
        if (!this.tempEltId) {
          this.tempEltId = 'xst-temp-xlv-elt';
        }
        this.tempElt = document.createElement("div");
        this.tempElt.id = this.tempEltId;
        this.tempElt.style.display = 'none';
      }
      let tempPuz = null;
      try {
        tempPuz = new Exolve(dataSansEnd + 'exolve-end',
          this.tempEltId, null, false, 0, 0, false);
      } catch (err) {
        console.log(err);
        tempPuz = null;
      }
      if (!tempPuz) {
        console.log('Crossword specs invalid: could not create Exolve object');
        return false;
      }
      idFromPuz = tempPuz.id;
      tempPuz.destroy();
      this.tempElt.innerHTML = '';
    }
    this.uploadData = dataSansEnd;
    this.uploadData += `  exolve-host: <a href="${this.exostURL}">Exost</a>\n`;
    if (idFromPuz && (dataSansEnd.indexOf('exolve-id:') < 0)) {
      /** Insert idFromPuz (must have been auto-generated) */
      this.uploadData += `  exolve-id: ${idFromPuz}\n`;
    }
    this.uploadData += 'exolve-end';

    /** Convert to alphanumeric id if needed */
    const idRegex = /^\s*exolve-id:\s*(.+)\s*$/m;
    const match = this.uploadData.match(idRegex);
    if (!match || match.length <= 1) {
      console.log('No exolve-id found in crossword specs.');
      return false;
    }
    const id = match[1];
    if (!this.idGoodForExost(id)) {
      this.uploadData = this.makeIdGoodForExost(this.uploadData, id);
    }
    return true;
  }

  setIpuz(specs) {
    let start = specs.indexOf('{')
    let end = specs.lastIndexOf('}')
    if (start < 0 || end < 0 || start >= end) {
      return false;
    }
    const ipuzJSON = specs.substring(start, end) + '}';
    try {
      const ipuz = JSON.parse(ipuzJSON);
      const exolve = exolveFromIpuz(ipuz, this.uploadFileName);
      if (!exolve) {
        return false;
      }
      return this.setExolve(exolve);
    } catch (err) {
      console.log(err);
    }
    return false;
  }

  setPuz(buffer) {
    const exolve = exolveFromPuz(buffer, this.uploadFileName);
    if (!exolve) {
      return false;
    }
    return this.setExolve(exolve, true);
  }

  setFromBuffer(buffer) {
    let utf8decoder = new TextDecoder();
    const specs = utf8decoder.decode(buffer);
    if (this.setExolve(specs)) {
      return true;
    }
    if (this.setIpuz(specs)) {
      return true;
    }
    if (this.setPuz(buffer)) {
      return true;
    }
    return false;
  }

  openFile(ev) {
    if (!this.uploadFileElt || !this.uploadStatusElt) {
      return;  /** unsuported */
    }
    const f = this.uploadFileElt.files[0];
    this.uploadData = '';
    this.uploadStatusElt.innerHTML = 'Reading...';
    if (!f) {
      this.uploadStatusElt.innerHTML = '';
      return;
    }
    const fr = new FileReader(); 
    fr.onload = (e => { 
      if (this.setFromBuffer(fr.result)) {
        this.uploadStatusElt.innerHTML = 'Ready to upload';
      } else {
        this.uploadStatusElt.innerHTML = 'Could not parse';
        this.uploadFileElt.value = '';
      }
    });
    this.uploadFileName = f.name;
    fr.readAsArrayBuffer(f);
  }
}
