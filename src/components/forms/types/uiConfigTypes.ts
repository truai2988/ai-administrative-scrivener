export interface ComputedRule {
  targetField: string;
  dependencies: string[];
  logic: string;
}

export interface UiSection {
  sectionKey: string;
  sectionLabel: string;
  fields: { fieldKey: string; label: string; inputType: string }[];
}

export interface FormUiConfig {
  formKey: string;
  formName: string;
  sections: UiSection[];
  computedRules: ComputedRule[];
}
