const { name } = require("pubsub-js");

let template = `
    @RequestMapping(value = "/load_win6007_update_delete_req", method = RequestMethod.POST)
    public ResultUtil win6007_curd(@RequestBody Map<String, List<LaboratoryChemicalReagentWebVo>> map) {
        List<LaboratoryChemicalReagentWebVo> updateList = map.get("updateList");
        List<LaboratoryChemicalReagentWebVo> deleteList = map.get("deleteList");

        updateList.stream().forEach(lbVo -> {
            LaboratoryChemicalReagent target = new LaboratoryChemicalReagent();
            BeanUtils.copyProperties(lbVo, target);
            target.setTbUpdateTime(LocalDateTime.now());
            if (target.getId() != null && target.getId() > 0) { 
                target.updateById();
            } else {
                target.insert();
            }

        });
        deleteList.stream().forEach(lbVo -> {
            LaboratoryChemicalReagent target = new LaboratoryChemicalReagent();
            target.setId(lbVo.getId());
            if (target.getId() != null && target.getId() > 0) {
                target.deleteById();
            }
        });

        return ResultUtil.success("success");
    }


    @RequestMapping(value = "/load_win6007_load_req", method = RequestMethod.POST)
    public ResultUtil win6007_listPage(@RequestBody PageVo pVo) {
        LaboratoryChemicalReagent target = new LaboratoryChemicalReagent();
        Page<LaboratoryChemicalReagent> page = new Page<>(pVo.getPageStart(), pVo.getPageSize());
        QueryWrapper<LaboratoryChemicalReagent> queryWrapper = new QueryWrapper<>();
        queryWrapper.orderByDesc("tb_update_time");
        IPage iPage = target.selectPage(page, queryWrapper);

        List<LaboratoryChemicalReagent> records = iPage.getRecords();
        List<LaboratoryChemicalReagentWebVo> resList = new ArrayList<>();

        for (LaboratoryChemicalReagent temp : records) {
            LaboratoryChemicalReagentWebVo vo = new LaboratoryChemicalReagentWebVo();
            BeanUtils.copyProperties(temp, vo);
            resList.add(vo);
        }

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("list", resList);
        resultMap.put("total", iPage.getTotal());

        return ResultUtil.success(resultMap);
    }


    @RequestMapping(value = "/load_win6007_export_req", method = RequestMethod.POST)
    public void win6007_export(@RequestBody Map<String, String> map, HttpServletRequest request, HttpServletResponse response) throws Exception {
        LaboratoryChemicalReagent tb = new LaboratoryChemicalReagent();
        List<LaboratoryChemicalReagent> list = tb.selectAll();
        List<LaboratoryChemicalReagentWebVo> voList = new ArrayList<>();
        int index = 0;
        for (LaboratoryChemicalReagent t : list) {
            LaboratoryChemicalReagentWebVo vo = new LaboratoryChemicalReagentWebVo();
            BeanUtils.copyProperties(t, vo);
            vo.setIndex(++index);
            voList.add(vo);
        }

        String templateFileName = commonTool.getStrCurrentClassPath() + "/excelTemplate/template_化学试剂管理.xlsx";
        String filePathWithName = getFilePath() + "化学试剂管理" + commonTool.nowNameStr() + ".xlsx";
        EasyExcel.write(filePathWithName).withTemplate(templateFileName).sheet().doFill(voList);

        downloadExcel(request, response, filePathWithName);
    }`


    // curd
let template_curd = `   @RequestMapping(value = "/load_win6007_update_delete_req", method = RequestMethod.POST)
    public ResultUtil win6007_curd(@RequestBody Map<String, List<LaboratoryChemicalReagentWebVo>> map) {
        List<LaboratoryChemicalReagentWebVo> updateList = map.get("updateList");
        List<LaboratoryChemicalReagentWebVo> deleteList = map.get("deleteList");
        return common_curd(updateList, deleteList,  LaboratoryChemicalReagent.class);
    }`;

    // listpage
let template_listpage = `
       @RequestMapping(value = "/load_win6007_load_req", method = RequestMethod.POST)
    public ResultUtil win6007_listPage(@RequestBody PageVo pVo) {
        return commonListPage(pVo, LaboratoryChemicalReagent.class, LaboratoryChemicalReagentWebVo.class);
    }`;

let template_export = `
    @RequestMapping(value = "/load_win6007_export_req", method = RequestMethod.POST)
    public void win6007_export(@RequestBody Map<String, String> map, HttpServletRequest request, HttpServletResponse response) throws Exception {
        common_export(request,response,LaboratoryChemicalReagent.class, LaboratoryChemicalReagentWebVo.class, "化学试剂管理");
    }
`
    
let myController = [{
    name: "LaboratoryDevice",
    url: "win6001",
    label: "仪器设备管理"
}, {
    name: "LaboratoryStandardMaterial",
    url: "win6002",
    label: "标准物质管理"
}, {
    name: "LaboratoryTestingPerson",
    url: "win6003",
    label: "检测人员汇总"
}, {
    name: "LaboratoryTrainingRecords",
    url: "win6005",
    label: "培训记录"
}, {
    name: "LaboratoryQuantityControl",
    url: "win6006",
    label: "质量控制计划"
}, {
    name: "LaboratoryPersonnelTechnicalFiles",
    url: "win6004",
    label: "人员技术档案"
    }]

myController = [{
    name: "LaboratorySampleBasis",
    url: "win8001",
    label: "⽔⼚采样记录"
}]

myController = [{
    name: "LaboratoryHeader",
    url: "win8000",
    label: "头部管理"
}]
function gen_javaController() {

    let template = template_curd+template_listpage+template_export;
    let result = "";
    myController.forEach(item => {
        let res = template.replace(/LaboratoryChemicalReagent/g, item.name);
        res = res.replace(/win6007/g, item.url);
        res = res.replace(/化学试剂管理/g, item.label);

        result += res
    })

    console.log(result);
}


let jsonVo = {
    "name": "姓名",
    "gender": "性别",
    "ethnicity": "民族",
    "origin": "籍贯",
    "dateOfBirth": "2024-09-19",
    "yearsOfEmployment": "参加工作时间",
    "photos": "路径",
    "academicDegree": "学历",
    "degree": "学位",
    "graduationSchool": "毕业学校",
    "specialized": "专业",
    "admissionDate": "2024-09-19",
    "graduationDate": "2024-09-19",
    "jobs": ["工作1", "工作2"],
    "office": "office",
    "jobTitle": "jobTitle",
    "workExperience": ["工作1", "工作2"],
    "trainingExperience": [
        {
            "trainingDuration": "",
            "trainingContent": "",
            "trainingOutcome": "",
            "proofMaterials": ""
        }
    ],
    "availableDetectionCapabilities": [
        {
            "startTime": "",
            "testItems": ["item1", "item2"]
        }
    ]
}

jsonVo = {
    "name": "姓名",
    "gender": "性别",
    "ethnicity": "民族",
    "origin": "籍贯",
    "dateOfBirth": "2024-09-19",
    "yearsOfEmployment": "参加工作时间",
    "photos": "路径",
    "academicDegree": "学历",
    "degree": "学位",
    "graduationSchool": "毕业学校",
    "specialized": "专业",
    "admissionDate": "2024-09-19",
    "graduationDate": "2024-09-19",
    "jobs": ["工作1", "工作2"],
    "office": "office",
    "jobTitle": "jobTitle",
    "workExperience": ["工作1", "工作2"],
    "trainingExperience": [
        {
            "trainingDuration": "",
            "trainingContent": "",
            "trainingOutcome": "",
            "proofMaterials": ""
        }
    ],
    "availableDetectionCapabilities": [
        {
            "startTime": "",
            "testItems": ["item1", "item2"]
        }
    ]
}

/**
 * 
采样地点 samplingLocation
采样⽇期 samplingDate
采样时间 samplingTime
采样体积及容器 samplingVolumeAndContainer
采样⼈ sampler
 */

jsonVo = {
    "samplingLocation": "采样地点",
    "samplingDate": "2021-09-25",
    "samplingTime": "13:23",
    "samplingVolumeAndContainer": "采样体积及容器",
    "sampler": "采样人",
}

jsonVo = {
    "tableName": "表明",
    "headValue": "json对象" 
}

// js 驼峰式转下划线
function humpToLine(name) {
    return name.replace(/([A-Z])/g, "_$1").toLowerCase();
}

// 首字母大写
function firstUpper(str) {
    return str.toUpperCase().substring(0, 1) + str.substring(1)
}


function mysql_field() {
    let str = Object.keys(jsonVo).map(item => {
        let r = "`tb_" + humpToLine(item) + "` varchar(128) DEFAULT NULL,";
        return r;
    }).join("\n");

    console.log(str)
}

function webvo(item) {
    let str = `@JSONField(name = "${item}")
private String tb${firstUpper(item)};`
    return str;
}

function webvo_field() {
    let str = Object.keys(jsonVo).map(item => {
        return webvo(item);
    }).join("\n\n");

    console.log(str)
}

// gen mysql
// mysql_field();
webvo_field();
// gen_javaController();
// gen webvo


