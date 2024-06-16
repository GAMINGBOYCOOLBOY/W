const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

app.post('/upload', upload.single('file'), (req, res) => {
    const filePath = path.join(__dirname, req.file.path);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading file');
        }

        const obfuscatedCode = obfuscateLuaCode(data);
        
        fs.unlinkSync(filePath); // Delete the original uploaded file

        res.setHeader('Content-disposition', 'attachment; filename=obfuscated.lua');
        res.setHeader('Content-type', 'text/plain');
        res.charset = 'UTF-8';
        res.write(obfuscatedCode);
        res.end();
    });
});

function obfuscateLuaCode(code) {
    const key = "supersecretkey";

    function generate_obfuscated_name(index) {
        return "_" + String.fromCharCode((index % 26) + 97) + Math.floor(index / 26);
    }

    function obfuscate_variables_and_functions(code) {
        const patterns = [
            ["%f[%a_]function%s+([%a_][%w_]*)", "fn"],
            ["%f[%a_]local%s+([%a_][%w_]*)", "var"],
            ["%f[%a_]([%a_][%w_]*)%s*=", "var"]
        ];

        let obfuscated_code = code;
        let index = 0;
        let seen = {};

        patterns.forEach(pattern => {
            obfuscated_code = obfuscated_code.replace(new RegExp(pattern[0], "g"), function (match, identifier) {
                if (!seen[identifier]) {
                    index++;
                    seen[identifier] = generate_obfuscated_name(index);
                }
                return pattern[1] + seen[identifier];
            });
        });

        return obfuscated_code;
    }

    function generate_checksum(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
        }
        return hash;
    }

    function anti_beautify(code) {
        const dummy_code = "if false then return end; ";
        return code.replace(/\s+/g, " ").replace(/;/g, ";\n" + dummy_code + ";\n");
    }

    function xor_encrypt_decrypt(data, key) {
        let result = [];
        for (let i = 0; i < data.length; i++) {
            result[i] = String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result.join('');
    }

    function obfuscateLuaCodeInternal(code) {
        // 1. Rename variables and functions
        let obfuscated_code = obfuscate_variables_and_functions(code);
        
        // 2. Add anti-tamper checks
        obfuscated_code = `
local function generate_checksum(str)
    local hash = 5381
    for i = 1, #str do
        hash = ((hash << 5) + hash) + string.byte(str, i)
    end
    return hash
end

local original_code = [[${obfuscated_code}]]

local expected_hash = generate_checksum(original_code)

local function check_integrity()
    if generate_checksum(original_code) ~= expected_hash then
        error('Code has been tampered with!')
    end
end

check_integrity()

${obfuscated_code}
        `;

        // 3. Apply anti-beautify techniques
        obfuscated_code = anti_beautify(obfuscated_code);
        
        // 4. Protect constants
        obfuscated_code = obfuscated_code.replace(/"([^"]*)"/g, function(match, constant) {
            return `xor_encrypt_decrypt("${xor_encrypt_decrypt(constant, key)}", "${key}")`;
        });
        
        // Add constant encryption/decryption function
        obfuscated_code = `
local function xor_encrypt_decrypt(data, key)
    local result = {}
    for i = 1, #data do
        result[i] = string.char(bit.bxor(string.byte(data, i), string.byte(key, (i - 1) % #key + 1)))
    end
    return table.concat(result)
end

${obfuscated_code}
        `;

        return obfuscated_code;
    }

    return `
loadstring([=[
${obfuscateLuaCodeInternal(code)}
]=])()
    `;
}

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
