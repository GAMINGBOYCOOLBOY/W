let obfuscatorSettings = {
    antiBeautify: true,
    antiTamper: true,
    maxProtection: true,
    constantDump: true
};

function obfuscateScript() {
    const luaScript = document.getElementById('lua-script').value;
    if (!luaScript) {
        alert('Please enter a Lua script to obfuscate.');
        return;
    }

    const obfuscatedScript = obfuscateLua(luaScript);
    document.getElementById('obfuscated-script').value = obfuscatedScript;
}

function randomString(length) {
    const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        result += charset[randomIndex];
    }
    return result;
}

function escapeString(str) {
    return str.replace(/[\\"]/g, '\\$&').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t').replace(/\v/g, '\\v');
}

function obfuscateLua(script) {
    const randomVariable = randomString(10);

    // Split the script into chunks to avoid issues with large scripts
    const chunks = splitIntoChunks(script, 1000);

    let obfuscatedScript = `local ${randomVariable} = function(chunk)\n`;
    obfuscatedScript += `    local success, chunk = pcall(function() return loadstring(chunk) end)\n`;
    obfuscatedScript += `    if not success or not chunk then\n`;
    obfuscatedScript += `        error("Failed to load chunk!")\n`;
    obfuscatedScript += `    end\n`;
    obfuscatedScript += `    chunk()\n`;
    obfuscatedScript += `end\n\n`;

    for (let chunk of chunks) {
        obfuscatedScript += `${randomVariable}("${escapeString(chunk)}")\n`;
    }

    obfuscatedScript += `\n`;

    if (obfuscatorSettings.maxProtection) {
        obfuscatedScript += `local env = {}\n`;
        obfuscatedScript += `setmetatable(env, {\n`;
        obfuscatedScript += `    __index = function(_, key)\n`;
        obfuscatedScript += `        if key == "debug" or key == "os" or key == "io" or key == "package" then\n`;
        obfuscatedScript += `            return nil\n`;
        obfuscatedScript += `        end\n`;
        obfuscatedScript += `        return _G[key]\n`;
        obfuscatedScript += `    end,\n`;
        obfuscatedScript += `    __newindex = function(_, key, value)\n`;
        obfuscatedScript += `        if key == "debug" or key == "os" or key == "io" or key == "package" then\n`;
        obfuscatedScript += `            return\n`;
        obfuscatedScript += `        end\n`;
        obfuscatedScript += `        rawset(_, key, value)\n`;
        obfuscatedScript += `    end\n`;
        obfuscatedScript += `})\n\n`;
    }

    if (obfuscatorSettings.constantDump) {
        obfuscatedScript += `local constantDump = function() end\n`;
        obfuscatedScript += `debug.setmetatable(constantDump, {\n`;
        obfuscatedScript += `    __tostring = function()\n`;
        obfuscatedScript += `        return "Constant dumped"\n`;
        obfuscatedScript += `    end,\n`;
        obfuscatedScript += `    __index = function(_, key)\n`;
        obfuscatedScript += `        return constantDump\n`;
        obfuscatedScript += `    end,\n`;
        obfuscatedScript += `    __newindex = function() end\n`;
        obfuscatedScript += `})\n\n`;
    }

    obfuscatedScript += `${randomVariable}()\n`;

    return obfuscatedScript;
}

function splitIntoChunks(str, chunkSize) {
    const chunks = [];
    for (let i = 0; i < str.length; i += chunkSize) {
        chunks.push(str.substring(i, i + chunkSize));
    }
    return chunks;
}

function enableDisableObfuscation() {
    const enableBtn = document.getElementById('enable-obfuscation');
    const disableBtn = document.getElementById('disable-obfuscation');

    enableBtn.addEventListener('click', function() {
        obfuscatorSettings = {
            antiBeautify: true,
            antiTamper: true,
            maxProtection: true,
            constantDump: true
        };
        enableBtn.disabled = true;
        disableBtn.disabled = false;
    });

    disableBtn.addEventListener('click', function() {
        obfuscatorSettings = {
            antiBeautify: false,
            antiTamper: false,
            maxProtection: false,
            constantDump: false
        };
        enableBtn.disabled = false;
        disableBtn.disabled = true;
    });
}

// Initialize enable/disable buttons
enableDisableObfuscation();
