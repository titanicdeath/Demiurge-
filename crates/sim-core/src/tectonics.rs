use crate::worldspec::WorldSpec;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PlateType { Oceanic, Continental }

#[derive(Debug, Clone)]
pub struct PlateMap {
    pub plate_count: usize,
    pub plate_ids: Vec<u16>,
    pub elevations_m: Vec<f64>,
    pub plate_types: Vec<PlateType>,
}

pub fn generate_tectonics(spec: &WorldSpec, vertices: &[[f64;3]]) -> PlateMap {
    let plate_count = match spec.body.tectonics.as_str() {
        "plate" => 10,
        "episodic" => 6,
        "stagnant-lid" => 2,
        "cryovolcanic" => 3,
        _ => 1,
    };
    let mut plate_ids = vec![0u16; vertices.len()];
    let mut elevations = vec![0.0f64; vertices.len()];
    for (i,v) in vertices.iter().enumerate() {
        let pid = ((v[0].abs()*7.0 + v[1].abs()*11.0 + v[2].abs()*13.0) as usize) % plate_count;
        plate_ids[i] = pid as u16;
        elevations[i] = if pid % 2 == 0 { -3200.0 } else { 350.0 };
    }
    let plate_types = (0..plate_count).map(|i| if i%2==0 { PlateType::Oceanic } else { PlateType::Continental }).collect();
    PlateMap { plate_count, plate_ids, elevations_m: elevations, plate_types }
}
