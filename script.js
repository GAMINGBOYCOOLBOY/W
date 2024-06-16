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

function obfuscateLua(script) {
    const throwAway = [];
    for (let i = 0; i < script.length; i++) {
        throwAway.push(script.charCodeAt(i));
    }

    let stringBuffer = '';
    for (const byte of throwAway) {
        stringBuffer += `\\${byte}`;
    }

    const randomVariable = randomString(10);
    const randomCheck = randomString(10);
    const randomEnv = randomString(10);

    const obfuscated = `
        local ${randomCheck} = function()
            local success = pcall(function() end)
            if not success then
                error("Anti-tamper triggered!")
            end
        end

        ${randomCheck}()

        local ${randomVariable} = loadstring("${stringBuffer}")()
        setfenv(${randomVariable}, setmetatable({}, {
            __index = function(_, key)
                if key == "debug" or key == "os" or key == "io" or key == "package" then
                    return nil
                end
                return _G[key]
            end,
            __newindex = function(_, key, value)
                if key == "debug" or key == "os" or key == "io" or key == "package" then
                    return
                end
                rawset(_, key, value)
            end
        }))

        local ${randomEnv} = {
            print = function(...)
                local args = {...}
                for i = 1, #args do
                    args[i] = tostring(args[i]):gsub(".", function(c)
                        return string.format("\\%03d", c:byte())
                    end)
                end
                _G.print(table.concat(args, " "))
            end
        }

        setmetatable(_G, {
            __index = ${randomEnv},
            __newindex = function() end
        })

        ${randomVariable}()
    `;

    return obfuscated.replace(/\s+/g, ' ');
}
