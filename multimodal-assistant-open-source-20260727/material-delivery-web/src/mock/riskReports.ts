import type { RiskReport } from '@/types/delivery'

export const normalRiskReport: RiskReport = {
  riskLevel: 'LOW',
  confirmedFacts: [
    {
      text: '车辆沿规划路线抵达项目现场',
      level: 'SUCCESS',
      label: '正常到场',
    },
    {
      text: '运输过程未发现路线偏离、异常停留或定位中断',
      level: 'SUCCESS',
      label: '运输正常',
    },
    {
      text: '到场材料厂家、牌号、规格和批次号均与出厂档案一致',
      level: 'SUCCESS',
      label: '身份一致',
    },
  ],
  riskExplanation:
    '现有出厂资料、运输轨迹和到场身份信息之间未发现明显冲突。',
  recommendations: [
    '按项目材料进场验收制度核验材料外观与数量',
    '保留本次数字档案和到场铭牌照片作为验收依据',
  ],
  acceptanceSuggestion: '未发现明显身份风险，可进入常规人工验收流程',
}

export const abnormalRiskReport: RiskReport = {
  riskLevel: 'HIGH',
  confirmedFacts: [
    {
      text: '到场批次号 A20260718028 与出厂批次号 A20260718026 不一致',
      level: 'CRITICAL',
      label: '严重冲突',
    },
    {
      text: '运输途中发生路线偏离',
      level: 'HIGH',
      label: '偏航风险',
    },
    {
      text: '车辆在非授权区域停留 45 分钟',
      level: 'WARNING',
      label: '异常停留',
    },
    {
      text: 'GPS 定位数据中断 15 分钟',
      level: 'INTERRUPTED',
      label: '定位中断',
    },
    {
      text: '实际运输时长超过计划到场时间',
      level: 'WARNING',
      label: '运输超时',
    },
  ],
  riskExplanation:
    '材料身份连续性存在较高风险，但现有证据不能直接证明材料已被调换。',
  recommendations: [
    '核验车辆封签记录和异常停留期间的装卸记录',
    '向供应商核实到场批次编码及对应质量证明资料',
    '补充到场批次的质保书并进行人工复核',
    '在身份冲突解除前暂缓本批次材料验收',
  ],
  acceptanceSuggestion: '暂缓验收，转人工复核',
}
