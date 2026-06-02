-- ============================================================
-- Migration 003: Reemplazar ejercicios por equipamiento disponible
-- Equipamiento: mancuernas, banco, elíptica, bicicleta, caminadora,
-- máquina press pecho, máquina remo/dorsales, máquina curl/extensión
-- piernas, bandas, step
-- ============================================================

-- Limpiar ejercicios existentes (primero dependencias por RESTRICT)
delete from workout_template_exercises;
delete from workout_session_exercises;
delete from workout_plan_exercises;
delete from exercises;

-- ============================================================
-- Cardio
-- ============================================================
insert into exercises (name, instructions, muscle_groups, resources) values
(
  'Caminata en caminadora',
  'Sube a la caminadora y camina a un ritmo moderado. Mantén una postura erguida, hombros relajados y core activo. Ajusta la inclinación para mayor intensidad.',
  array['Piernas','Glúteos','Cardiovascular'],
  '[]'
),
(
  'Trote en caminadora',
  'Trota a un ritmo constante sobre la caminadora. Aterriza con el mediopié, mantén el torso ligeramente inclinado hacia adelante y los brazos en 90°.',
  array['Piernas','Glúteos','Cardiovascular'],
  '[]'
),
(
  'Elíptica',
  'Súbete a la elíptica y pedalea con movimiento suave y continuo. Mantén el core activo y usa los brazos para impulsar. Ajusta la resistencia según tu nivel.',
  array['Piernas','Glúteos','Cardiovascular','Brazos'],
  '[]'
),
(
  'Bicicleta estática',
  'Siéntate en la bicicleta estática con la espalda recta y las rodillas ligeramente flexionadas en la extensión del pedal. Pedalea a ritmo constante. Ajusta la resistencia según la intensidad deseada.',
  array['Cuádriceps','Isquiotibiales','Glúteos','Cardiovascular'],
  '[]'
),
(
  'Bicicleta reclinada',
  'Siéntate en la bicicleta inclinada con la espalda apoyada en el respaldo. Coloca los pies en los pedales y pedalea con movimiento suave. Ideal para menor impacto en la zona lumbar.',
  array['Cuádriceps','Isquiotibiales','Glúteos','Cardiovascular'],
  '[]'
),

-- ============================================================
-- Pecho
-- ============================================================
(
  'Máquina de press de pecho',
  'Siéntate en la máquina con la espalda totalmente apoyada en el respaldo. Agarra las empuñaduras a la altura del pecho. Empuja hacia adelante hasta extender los brazos sin bloquear los codos. Regresa lentamente.',
  array['Pecho','Tríceps','Hombros'],
  '[]'
),
(
  'Press de mancuernas en banco plano',
  'Acuéstate en el banco plano con una mancuerna en cada mano a la altura del pecho. Empuja las mancuernas hacia arriba hasta extender los brazos. Baja lentamente controlando el movimiento.',
  array['Pecho','Tríceps','Hombros Anteriores'],
  '[]'
),
(
  'Press de mancuernas inclinado',
  'Coloca el banco a 30-45°. Acuéstate con una mancuerna en cada mano. Empuja hacia arriba y ligeramente hacia el centro. Baja con control hasta la altura del pecho.',
  array['Pecho Superior','Hombros','Tríceps'],
  '[]'
),
(
  'Aperturas con mancuernas en banco plano',
  'Acuéstate en el banco plano con una mancuerna en cada mano, brazos extendidos sobre el pecho. Baja los brazos hacia los lados en arco amplio manteniendo una leve flexión en el codo. Regresa al punto inicial contrayendo el pecho.',
  array['Pecho','Hombros Anteriores'],
  '[]'
),
(
  'Aperturas con mancuernas inclinado',
  'Coloca el banco a 30-45°. Realiza el mismo movimiento de apertura que en banco plano. Este ángulo activa más el pecho superior.',
  array['Pecho Superior','Hombros Anteriores'],
  '[]'
),
(
  'Flexiones',
  'Colócate en posición de plancha con las manos a la altura del pecho, algo más anchas que los hombros. Baja el pecho hasta casi tocar el suelo manteniendo el cuerpo recto. Empuja hacia arriba.',
  array['Pecho','Tríceps','Hombros','Core'],
  '[]'
),
(
  'Press de pecho con banda',
  'Ancla la banda a la altura del pecho detrás de ti. Sujeta los extremos y empuja hacia adelante hasta extender los brazos. Regresa lentamente resistiendo la banda.',
  array['Pecho','Tríceps','Hombros Anteriores'],
  '[]'
),

-- ============================================================
-- Espalda
-- ============================================================
(
  'Remo sentado en polea',
  'Siéntate en la máquina de remo con los pies apoyados. Tira del mango hacia el abdomen manteniendo la espalda recta y los codos cerca del cuerpo. Aprieta los omóplatos al final del movimiento. Extiende lentamente.',
  array['Dorsales','Romboides','Bíceps','Deltoides Posteriores'],
  '[]'
),
(
  'Jalón al pecho en polea',
  'Siéntate frente a la máquina de dorsales. Sujeta la barra con las manos algo más anchas que los hombros. Tira hacia abajo hasta llevar la barra a la altura de la clavícula, sacando pecho. Sube lentamente.',
  array['Dorsales','Romboides','Bíceps','Deltoides Posteriores'],
  '[]'
),
(
  'Remo con mancuerna a un brazo',
  'Apoya una rodilla y la mano del mismo lado en el banco. Con la mano libre, sujeta la mancuerna y tírala hacia la cadera manteniendo el codo cerca del cuerpo. Baja con control.',
  array['Dorsales','Romboides','Bíceps','Deltoides Posteriores'],
  '[]'
),
(
  'Remo con mancuernas apoyado en banco',
  'Inclínate apoyando el pecho en el banco inclinado a 45°. Con una mancuerna en cada mano, realiza el movimiento de remo tirando los codos hacia atrás y apretando los omóplatos.',
  array['Dorsales','Romboides','Bíceps','Deltoides Posteriores'],
  '[]'
),
(
  'Remo con banda',
  'Ancla la banda a un punto fijo a la altura del pecho. Sujeta los extremos y tira hacia atrás juntando los omóplatos. Mantén la espalda recta y los codos cerca del cuerpo.',
  array['Dorsales','Romboides','Bíceps','Deltoides Posteriores'],
  '[]'
),
(
  'Jalón al pecho con banda',
  'Ancla la banda en alto (puerta, barra). Sujeta los extremos y tira hacia abajo y hacia afuera hasta llevar las manos a la altura del pecho. Regresa lentamente.',
  array['Dorsales','Bíceps'],
  '[]'
),

-- ============================================================
-- Hombros
-- ============================================================
(
  'Press de hombros con mancuernas',
  'Siéntate o de pie con las mancuernas a la altura de los hombros, codos en 90°. Empuja hacia arriba hasta casi extender los brazos. Baja lentamente. Mantén el core activo para proteger la zona lumbar.',
  array['Hombros','Tríceps','Trapecio Superior'],
  '[]'
),
(
  'Elevaciones laterales con mancuernas',
  'De pie con una mancuerna en cada mano a los lados. Levanta los brazos hacia los lados hasta la altura de los hombros con una leve flexión en el codo. Baja con control.',
  array['Deltoides Laterales'],
  '[]'
),
(
  'Elevaciones frontales con mancuernas',
  'De pie con una mancuerna en cada mano frente a los muslos. Levanta un brazo (o ambos) hacia adelante hasta la altura del hombro. Baja lentamente.',
  array['Deltoides Anteriores','Pecho Superior'],
  '[]'
),
(
  'Pájaros con mancuernas',
  'Inclínate hacia adelante con la espalda recta, mancuernas colgando. Abre los brazos hacia los lados hasta la altura de los hombros, contrayendo los deltoides posteriores y los romboides. Baja con control.',
  array['Deltoides Posteriores','Romboides','Trapecio'],
  '[]'
),
(
  'Elevaciones laterales con banda',
  'Pisa la banda con un pie. Sujeta el extremo con la mano del mismo lado. Levanta el brazo hacia el lado hasta la altura del hombro. Baja controlando la resistencia.',
  array['Deltoides Laterales'],
  '[]'
),

-- ============================================================
-- Bíceps
-- ============================================================
(
  'Curl de bíceps con mancuernas',
  'De pie o sentado con una mancuerna en cada mano, palmas hacia adelante. Flexiona los codos llevando las mancuernas hacia los hombros. Mantén los codos pegados al cuerpo. Baja lentamente.',
  array['Bíceps','Antebrazos'],
  '[]'
),
(
  'Curl martillo con mancuernas',
  'Igual que el curl de bíceps pero con las palmas mirándose entre sí (agarre neutro). Este agarre activa más el braquial y los antebrazos.',
  array['Bíceps','Braquial','Antebrazos'],
  '[]'
),
(
  'Curl de concentración con mancuerna',
  'Siéntate con la pierna ligeramente abierta. Apoya el codo del brazo que trabaja en el interior del muslo. Curl lento hacia arriba, apretando el bíceps en la cima. Baja con control.',
  array['Bíceps'],
  '[]'
),
(
  'Curl de bíceps con banda',
  'Pisa la banda con ambos pies. Sujeta los extremos con ambas manos. Realiza el curl de bíceps tirando hacia arriba resistiendo la banda. Mantén los codos fijos.',
  array['Bíceps','Antebrazos'],
  '[]'
),

-- ============================================================
-- Tríceps
-- ============================================================
(
  'Extensión de tríceps sobre la cabeza con mancuerna',
  'Siéntate o de pie. Sostén una mancuerna con ambas manos sobre la cabeza. Baja la mancuerna detrás de la cabeza doblando los codos. Extiende los brazos volviendo al punto inicial.',
  array['Tríceps'],
  '[]'
),
(
  'Patada de tríceps con mancuerna',
  'Inclínate hacia adelante apoyando una mano y rodilla en el banco. Con la mancuerna en la otra mano, lleva el codo a 90° pegado al cuerpo. Extiende el brazo hacia atrás. Regresa lentamente.',
  array['Tríceps'],
  '[]'
),
(
  'Press francés con mancuernas en banco',
  'Acuéstate en el banco plano con una mancuerna en cada mano, brazos extendidos sobre el pecho. Dobla solo los codos bajando las mancuernas hacia las sienes. Extiende de vuelta.',
  array['Tríceps'],
  '[]'
),
(
  'Extensión de tríceps con banda',
  'Ancla la banda en un punto alto. Da la espalda al anclaje y sujeta los extremos. Extiende los brazos hacia abajo manteniendo los codos fijos junto al cuerpo.',
  array['Tríceps'],
  '[]'
),

-- ============================================================
-- Piernas y Glúteos
-- ============================================================
(
  'Máquina de curl de piernas',
  'Acuéstate boca abajo en la máquina y coloca los tobillos bajo el rodillo. Flexiona las rodillas llevando los talones hacia los glúteos. Aprieta al final. Baja lentamente.',
  array['Isquiotibiales','Glúteos'],
  '[]'
),
(
  'Máquina de extensión de piernas',
  'Siéntate en la máquina con las rodillas en el borde del asiento y los tobillos bajo el rodillo. Extiende las piernas hasta arriba apretando el cuádriceps. Baja lentamente.',
  array['Cuádriceps'],
  '[]'
),
(
  'Sentadilla con mancuernas',
  'De pie con una mancuerna en cada mano a los lados. Separa los pies al ancho de los hombros. Baja flexionando rodillas y cadera hasta que los muslos queden paralelos al suelo. Sube empujando desde los talones.',
  array['Cuádriceps','Glúteos','Isquiotibiales','Core'],
  '[]'
),
(
  'Sentadilla sumo con mancuerna',
  'De pie con los pies más separados que el ancho de hombros y los pies ligeramente girados hacia afuera. Sostén una mancuerna con ambas manos frente al cuerpo. Baja flexionando las rodillas hacia afuera. Sube apretando los glúteos.',
  array['Cuádriceps Internos','Glúteos','Isquiotibiales','Aductores'],
  '[]'
),
(
  'Estocadas con mancuernas',
  'De pie con una mancuerna en cada mano. Da un paso largo hacia adelante y baja la rodilla trasera casi hasta el suelo. Vuelve a la posición inicial y alterna piernas.',
  array['Cuádriceps','Glúteos','Isquiotibiales','Core'],
  '[]'
),
(
  'Peso muerto rumano con mancuernas',
  'De pie con una mancuerna en cada mano frente a los muslos. Con una leve flexión de rodillas fija, bisagra en la cadera empujando las caderas hacia atrás y bajando las mancuernas por las piernas. Siente el estiramiento en isquiotibiales y sube contrayendo los glúteos.',
  array['Isquiotibiales','Glúteos','Erectores'],
  '[]'
),
(
  'Hip thrust con mancuerna',
  'Apoya la parte alta de la espalda en el banco. Coloca una mancuerna sobre las caderas y los pies al ancho de hombros. Empuja las caderas hacia arriba hasta que el cuerpo quede en línea recta. Aprieta los glúteos en la cima. Baja lentamente.',
  array['Glúteos','Isquiotibiales'],
  '[]'
),
(
  'Elevación de talones con mancuernas',
  'De pie con una mancuerna en cada mano. Coloca los dedos de los pies en el borde del step o en el suelo. Eleva los talones tanto como puedas contrayendo los gemelos. Baja controladamente.',
  array['Gemelos'],
  '[]'
),
(
  'Step-up con mancuernas',
  'De pie frente al step con una mancuerna en cada mano. Sube un pie al step y empuja con ese talón para levantar el cuerpo. Baja el pie contrario lentamente. Alterna piernas.',
  array['Cuádriceps','Glúteos','Isquiotibiales'],
  '[]'
),
(
  'Patada de glúteo con banda',
  'Ancla la banda a un punto bajo o pisa la banda con las manos. Colócate en cuadrupedia. Extiende una pierna hacia atrás y arriba contrayendo el glúteo. Baja lentamente.',
  array['Glúteos','Isquiotibiales'],
  '[]'
),
(
  'Abducción de cadera con banda',
  'Coloca la banda alrededor de los muslos o tobillos. De pie o acostado de lado, separa las piernas contra la resistencia de la banda. Regresa lentamente.',
  array['Abductores','Glúteos Medios'],
  '[]'
),
(
  'Sentadilla con banda',
  'Coloca la banda alrededor de los muslos o sobre los hombros. Realiza la sentadilla manteniendo las rodillas alineadas con los pies y empujando contra la resistencia de la banda.',
  array['Cuádriceps','Glúteos','Isquiotibiales'],
  '[]'
),

-- ============================================================
-- Core y Abdomen
-- ============================================================
(
  'Plancha',
  'Apóyate en los antebrazos y los dedos de los pies. Mantén el cuerpo en línea recta de cabeza a talones. Activa el core y los glúteos. Aguanta la posición.',
  array['Core','Hombros','Glúteos'],
  '[]'
),
(
  'Plancha lateral',
  'Apóyate en un antebrazo con el cuerpo de lado, en línea recta. Levanta las caderas del suelo. Aguanta. Repite del otro lado.',
  array['Oblicuos','Core'],
  '[]'
),
(
  'Crunch abdominal',
  'Acuéstate boca arriba con las rodillas flexionadas y los pies en el suelo. Cruza los brazos sobre el pecho o pon las manos detrás de la cabeza. Sube el torso hacia las rodillas contrayendo el abdomen. Baja con control.',
  array['Abdomen'],
  '[]'
),
(
  'Elevación de piernas',
  'Acuéstate boca arriba con las piernas extendidas. Levanta las piernas hasta 90° manteniendo el core contraído y la zona lumbar pegada al suelo. Baja lentamente.',
  array['Abdomen Inferior','Core'],
  '[]'
),
(
  'Mountain climbers',
  'Empieza en posición de plancha alta. Lleva alternadamente las rodillas hacia el pecho a ritmo rápido. Mantén las caderas bajas y el core activo.',
  array['Core','Hombros','Cardiovascular'],
  '[]'
),
(
  'Russian twist con mancuerna',
  'Siéntate en el suelo con las rodillas flexionadas y el torso ligeramente inclinado hacia atrás. Sostén una mancuerna con ambas manos. Gira el torso de lado a lado llevando la mancuerna a cada cadera.',
  array['Oblicuos','Core'],
  '[]'
),

-- ============================================================
-- Step
-- ============================================================
(
  'Step aeróbico básico',
  'De pie frente al step. Sube un pie, luego el otro, y baja en el mismo orden. Mantén un ritmo constante. Alterna el pie que sube primero. Mantén el core activo y la postura erguida.',
  array['Cuádriceps','Glúteos','Gemelos','Cardiovascular'],
  '[]'
),
(
  'Elevaciones de gemelos en step',
  'Coloca la parte delantera de los pies en el borde del step, talones al aire. Baja los talones por debajo del nivel del step para estirar los gemelos. Sube en puntas de pie contrayendo los gemelos.',
  array['Gemelos'],
  '[]'
);
