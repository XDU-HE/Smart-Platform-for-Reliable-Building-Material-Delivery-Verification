export interface PurchaseOrder {
  purchaseOrderId: string
  supplier: string
  materialName: string
  grade: string
  specification: string
  quantity: string
  deliveryProject: string
}

export interface MaterialRecognition {
  manufacturer: string
  materialName: string
  grade: string
  specification: string
  batchNo: string
  furnaceNo?: string
  productionDate?: string
}

export type MaterialIdentityFieldKey =
  | 'manufacturer'
  | 'materialName'
  | 'grade'
  | 'specification'
  | 'batchNo'

export interface LocalUploadFile {
  file: File
  fileName: string
  mimeType: string
  previewUrl?: string
}

export type CompareResult = 'MATCH' | 'MISMATCH'

export interface OrderCompareRow {
  fieldKey: string
  fieldLabel: string
  orderValue: string
  recognitionValue: string
  result: CompareResult
}

export interface MaterialCompareRow {
  fieldKey: MaterialIdentityFieldKey
  fieldLabel: string
  factoryValue: string
  arrivalValue: string
  result: CompareResult
}
