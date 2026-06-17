use std::collections::BTreeMap;

use serde_json::Value as JsonValue;
use vrl::compiler::{
    CompileConfig, TargetValue, TimeZone, TypeState, compile_with_state,
    runtime::Runtime,
};
use vrl::value::{Secrets, Value as VrlValue};

use crate::error::ApiResult;
use crate::models::{VrlTestRequest, VrlTestResponse};

pub fn test_vrl(request: VrlTestRequest) -> ApiResult<VrlTestResponse> {
    let functions = vector_vrl_functions::all();
    let event_value = json_to_vrl(&request.event)?;
    let state = TypeState::default();
    let mut runtime = Runtime::default();
    let config = CompileConfig::default();
    let timezone = TimeZone::default();

    let mut target_value = TargetValue {
        value: event_value,
        metadata: VrlValue::Object(BTreeMap::new()),
        secrets: Secrets::new(),
    };

    let compilation = match compile_with_state(&request.source, &functions, &state, config) {
        Ok(result) => result,
        Err(diagnostics) => {
            return Ok(VrlTestResponse {
                result: None,
                error: Some(format_diagnostics(&diagnostics)),
                line: diagnostic_line(&diagnostics),
            });
        }
    };

    match runtime.resolve(&mut target_value, &compilation.program, &timezone) {
        Ok(_) => Ok(VrlTestResponse {
            result: Some(vrl_to_json(&target_value.value)),
            error: None,
            line: None,
        }),
        Err(err) => Ok(VrlTestResponse {
            result: None,
            error: Some(err.to_string()),
            line: None,
        }),
    }
}

fn format_diagnostics(diagnostics: &vrl::diagnostic::DiagnosticList) -> String {
    diagnostics
        .clone()
        .into_iter()
        .map(|d| d.message().to_string())
        .collect::<Vec<_>>()
        .join("\n")
}

fn diagnostic_line(diagnostics: &vrl::diagnostic::DiagnosticList) -> Option<u32> {
    diagnostics
        .clone()
        .into_iter()
        .next()
        .and_then(|d| d.labels().first().map(|l| l.span.start() as u32 + 1))
}

fn json_to_vrl(value: &JsonValue) -> ApiResult<VrlValue> {
    Ok(VrlValue::from(value))
}

fn vrl_to_json(value: &VrlValue) -> JsonValue {
    value
        .clone()
        .try_into()
        .unwrap_or(JsonValue::Null)
}
