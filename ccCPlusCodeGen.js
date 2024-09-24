const fs = require('fs');
const util = require('util');
const readline = require('node:readline/promises');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// ^[A-Za-z]: 表示盘符
// [^\\/:*?"<>|\r\n]表示非法的路径字符
// (?:[^\\/:*?"<>|\r\n]+\/) 表示非捕获分组 比如 GWork/ 
// [^\\/:*?"<>|\r\n]+\.[a-zA-Z]+ 表示合法的路径字符+后缀名
function validateFilePath(strTargetFilePath) {
    const regex = /^[A-Za-z]:\/(?:[^\\/:*?"<>|\r\n]+\/)*[^\\/:*?"<>|\r\n]+\.[a-zA-Z]+$/;
    return regex.test(strTargetFilePath);
}

function removeSlash(str) {
    let noSpace = str.trim();
    let rst = noSpace.replace(/^(;|\/\/)\s*/, '');
    return rst;
}


/**
 * begin和end成对出现才算一组, 去除每一组的空行
 * @param {*} lines 
 * @returns 
 */
function parseTemplate(lines) {
    let currentGroup = [];
    let arrGroup = [];
    lines.forEach((line) => {
        if (line.trim().endsWith("_end")) {
            currentGroup.push(line);

            // 去掉开头的空行
            while (currentGroup[0].trim() == "") {
                currentGroup.shift();
            }

            // begin和end成对出现
            let subEndStr = removeSlash(line);
            let bg = subEndStr.substring(0, subEndStr.indexOf("_end")) + "_begin";
            // todo
            let bgIdx = currentGroup.findIndex(item => item.indexOf(bg) != -1);
            if (bgIdx != -1) {
                arrGroup.push(currentGroup);
            } else {
                console.error("找不到对应的begin");
            }

            currentGroup = [];
        } else {
            currentGroup.push(line);
        }
    });
    return arrGroup;
}

// let operateType = 1;// 1: read, 2: addOrEdit, 3: delete, 4: writeRead
async function onRun(operateType) {
    // 模板的每一个分组
    let arrTemplateGroup = [];

    let strTargetFilePath = ""
    // 需要修改的文件每一行
    let arrTargetFileLines = [];

    let edit = 0, insert = 0, del = 0, read = 0;
    // 读取到的指定
    let readLines = [];

    const readFile = "G:/GWork/cplusGen/read_rst.cpp";
    function writeMyFile() {
        if (strTargetFilePath && (edit + insert + del) > 0) {
            // 写入文件
            fs.writeFileSync(strTargetFilePath, arrTargetFileLines.join("\r\n"), 'utf-8');
            console.log(`写入${strTargetFilePath}  edit: ${edit}, insert: ${insert}, delete: ${del} `);
            edit = 0;
            insert = 0;
            del = 0;
        }
    }
    function readMyFile() {
        // 写入文件 
        let content = readLines.map(gp => gp.join("\r\n")).join("\r\n\r\n");

        fs.writeFileSync(readFile, content, 'utf-8');
        console.log(`读取${readFile}  read: ${read}`);
        read = 0;
    }


    function regexSplit(lines, stRegex, endRegex, startIdx, endIdx) {
        let arr = [];
        let ele = {};
        for (let i = startIdx; i < endIdx; i++) {
            let line = lines[i];
            let m = null;
            if (m = line.match(stRegex)) {
                ele = { stName: m[0], stIdx: i };
            } else if (m = line.match(endRegex)) {
                ele = { ...ele, endName: m[0], endIdx: i };
                if (ele.hasOwnProperty("stName")) {
                    arr.push(ele);
                }
            }
        }

        return arr;
    }



    async function deleteComponent(fPath, cmpId) {
        let fContent = fs.readFileSync(fPath, 'utf-8');
        const fLines = fContent.split(/\r?\n/);
        let regexCmpStart = /ccgen_([a-zA-Z0-9]+)_([a-zA-Z0-9]+)_begin/;
        let regexCmpEnd = /ccgen_([a-zA-Z0-9]+)_([a-zA-Z0-9]+)_end/;
        let regexRangeStart = /ccgen_([a-zA-Z0-9]+)_begin/;
        let regexRangeEnd = /ccgen_([a-zA-Z0-9]+)_end/;
        // 我需要一次遍历记下所有结构 
        let arr = regexSplit(fLines, regexRangeStart, regexRangeEnd, 0, fLines.length);

        for (let i = 0; i < arr.length; i++) {
            let { stIdx, endIdx } = arr[i];
            let arrCmp = regexSplit(fLines, regexCmpStart, regexCmpEnd, stIdx, endIdx + 1);
            arr[i].children = arrCmp;
        }

        console.log("处理文件",fPath);
        console.log(util.inspect(arr, { showHidden: false, depth: null }));


        // 从arr中找出来cmpId
        regexCmpStart = new RegExp(`ccgen_${cmpId}_([a-zA-Z0-9]+)_begin`);
        regexCmpEnd = new RegExp(`ccgen_${cmpId}_([a-zA-Z0-9]+)_end`);
        let rst =[];
        arr.forEach(range => {
            range.children.forEach(cmp => {
                const { stName, endName } = cmp;
                if(stName.match(regexCmpStart) && endName.match(regexCmpEnd)){
                    rst.push(cmp);   
                }
            })
        })
        console.log("找到匹配项为", util.inspect(rst, { showHidden: false, depth: null }));


        // 执行删除
        let del_set = new Set();
        rst.forEach(item => {
            const { stIdx, endIdx } = item;
            for (let i = stIdx; i <= endIdx; i++) {
                del_set.add(i);
            }
        })
        let res = []
        for (let i = 0; i<fLines.length; i++){
            if(!del_set.has(i)){
                res.push(fLines[i]);
            }
        }
        fs.writeFileSync(fPath, res.join("\r\n"), 'utf-8');
    }

    function getIds(file) {
        let id_set = new Set();
        let fPath = removeSlash(file)
        let fContent = fs.readFileSync(fPath, 'utf-8');
        const fLines = fContent.split(/\r?\n/);
        let regex = /ccgen_([a-zA-Z0-9]+)_([a-zA-Z0-9]+)_begin/;
        fLines.forEach(line => {
            let m = line.match(regex);
            if (m && m.length == 3) {
                id_set.add(m[1]);
            }
        })
        return id_set;
    }

    async function ccGen() {
        // #region 获取模板分组
        // 读取文件内容
        let templateContent = fs.readFileSync('G:/GWork/cplusGen/template2.cpp', 'utf-8');
        if (operateType == 4) {
            templateContent = fs.readFileSync(readFile, 'utf-8');
        } 

        // 按照空行进行分组
        const lines = templateContent.split(/\r?\n/);

        // 思路直到遇到end建立新的分组
        arrTemplateGroup = parseTemplate(lines);

        // #endregion


        if (operateType == 5) {
            // 列出所有的组件id 
            // 所有id去重 
            let id_set = new Set();
            lines.filter(item => validateFilePath(removeSlash(item))).forEach(file => {
                getIds(file).forEach(id => {
                    id_set.add(id);
                }) 
            })
             
            console.log(id_set)
            const cmpId = await rl.question('请输入要删除的组件id\n'); 
            for (let line of lines) {
                let tFile = removeSlash(line);
                if (validateFilePath(tFile)) {
                    await deleteComponent(tFile, cmpId);
                }
            }
        } else if (operateType == 6) { 
            // 列出所有的组件id 
            // 所有id去重 
            let id_set = new Set();
            lines.filter(item => validateFilePath(removeSlash(item))).forEach(file => {
                getIds(file).forEach(id => {
                    id_set.add(id);
                })
            })

            console.log("id列表为=>",id_set)
        } else {
            for (let i = 0; i < arrTemplateGroup.length; i++) {
                try {
                    let templateGroup = [...arrTemplateGroup[i]];
                    if (validateFilePath(removeSlash(templateGroup[0]))) {
                        // 遇到路径, 写入上一个分组
                        writeMyFile();
                        strTargetFilePath = removeSlash(templateGroup.shift());
                        let cachedContent = fs.readFileSync(strTargetFilePath, 'utf-8');
                        arrTargetFileLines = cachedContent.split(/\r?\n/);
                    }

                    const begin = removeSlash(templateGroup[0]), end = removeSlash(templateGroup[templateGroup.length - 1]);
                    const parts = begin.split('_');
                    const groupType = parts[0] + "_" + parts[2]; // 组类型，如 ccgen_h  
                    // 表示文件有效范围
                    const rangeBegin = arrTargetFileLines.findIndex(item => item.indexOf(`${groupType}_begin`) != -1);
                    const rangeEnd = arrTargetFileLines.findIndex(item => item.indexOf(`${groupType}_end`) != -1);

                    // 找到ccgen_h的范围, 不包括ccgen_h_end
                    if (rangeBegin !== -1 && rangeEnd !== -1) {
                        const groupContentLines = arrTargetFileLines.slice(rangeBegin, rangeEnd);
                        const elementBegin = groupContentLines.findIndex(item => item.indexOf(begin) != -1);
                        const elementEnd = groupContentLines.findIndex(item => item.indexOf(end) != -1);

                        let newContentLines = [];
                        // 组件的范围, 包括组件_end
                        // operateType 1: read, 2: addOrEdit, 3: delete
                        if (operateType == 1) {
                            let newGroup = [];
                            if (validateFilePath(removeSlash(arrTemplateGroup[i][0]))) {
                                newGroup.push(arrTemplateGroup[i][0]);
                            }
                            if (elementBegin !== -1 && elementEnd !== -1) {
                                newGroup = [...newGroup, ...groupContentLines.slice(elementBegin, elementEnd + 1)];
                                readLines.push(newGroup);
                            }

                            read++;
                            continue;
                        } else if (operateType == 2 || operateType == 4) {
                            if (elementBegin !== -1 && elementEnd !== -1) {
                                newContentLines = [...groupContentLines.slice(0, elementBegin), ...templateGroup, ...groupContentLines.slice(elementEnd + 1)];
                                edit++;
                            } else {
                                // 没有找到 ccgen_h_getMergeRanges_begin 和 ccgen_h_getMergeRanges_end
                                // 在 ccgen_h_end 这一行之上插入操作
                                newContentLines = [...groupContentLines, ...templateGroup ];
                                insert++;
                            }
                        } else if (operateType == 3) {
                            if (elementBegin !== -1 && elementEnd !== -1) {
                                newContentLines = [...groupContentLines.slice(0, elementBegin), ...groupContentLines.slice(elementEnd + 1)];
                                del++;
                            }
                        }

                        // 因为newContentLines包含了开头ccgen_h_begin不包含结尾ccgen_h_end
                        arrTargetFileLines = [...arrTargetFileLines.slice(0, rangeBegin), ...newContentLines, ...arrTargetFileLines.slice(rangeEnd)];
                    }
                } catch (e) {
                    console.error(e);
                }
            }
        }
        if (operateType == 1) {
            readMyFile();
        } else if (operateType <= 4) {
            writeMyFile();
        }
    }



    await ccGen();
}




async function getUserInput() {
    // rl.question('请确认操作 0:exit, 1: read, 2: addOrEdit, 3: delete, 4: 写入读取, 5:listAll\n', async (name) => {
    //     let ipt = name.trim().toLowerCase()
    //     if (ipt === '1' || ipt === '2' || ipt === '3' || ipt === '4' || ipt === '5') {
    //       await  onRun(ipt);
    //         // rl.close();
    //     }

    //     getUserInput(); 
    // });

    const name = await rl.question('请确认操作 0:exit, 1: read, 2: addOrEdit, 3: delete, 4: 写入读取, 5:listAllThenDelete, 6:listAll\n');
    let ipt = name.trim().toLowerCase()
    if (['1', '2', '3', '4', '5', '6'].includes(ipt)) {
        await onRun(ipt);
    }

    getUserInput();
}

getUserInput();