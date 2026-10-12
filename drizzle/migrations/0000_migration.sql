CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- First account created becomes the admin
CREATE OR REPLACE FUNCTION public.handle_first_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created_admin AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_first_admin();

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  area text NOT NULL DEFAULT '',
  phone text,
  email text,
  website text,
  opening_time time NOT NULL DEFAULT '09:00',
  closing_time time NOT NULL DEFAULT '18:00',
  is_24h boolean NOT NULL DEFAULT false,
  services text[] NOT NULL DEFAULT '{}',
  verified boolean NOT NULL DEFAULT false,
  latitude double precision,
  longitude double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.facilities TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.facilities TO authenticated;
GRANT ALL ON public.facilities TO service_role;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read facilities" ON public.facilities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage facilities" ON public.facilities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  user_name text NOT NULL CHECK (char_length(user_name) BETWEEN 1 AND 60),
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '' CHECK (char_length(comment) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.feedback(facility_id);
GRANT SELECT, INSERT ON public.feedback TO anon, authenticated;
GRANT DELETE ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read feedback" ON public.feedback FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can submit feedback" ON public.feedback FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins delete feedback" ON public.feedback FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

INSERT INTO public.categories (slug,name,description) VALUES
('clinic','Clinics','General practice, specialist and outpatient care'),
('lab','Labs','Diagnostic testing, pathology and imaging'),
('pharmacy','Pharmacies','Prescriptions, OTC medicines and health products'),
('support','Support Facilities','Rehab, mental health, blood banks and home care');

INSERT INTO public.facilities (name,category,description,address,area,phone,email,website,opening_time,closing_time,is_24h,services,verified,latitude,longitude) VALUES
('CityCare Family Clinic','clinic','Walk-in family medicine practice with same-day appointments and paediatric care.','12 Model Town Road','Jalandhar','+91 181 245 1100','hello@citycare.in','https://citycare.in','08:00','20:00',false,'{General Medicine,Paediatrics,Vaccinations,Health Checkups}',true,31.3260,75.5762),
('Sunrise Multispeciality Clinic','clinic','Specialist consultations in cardiology, orthopaedics and dermatology under one roof.','45 GT Road, Near Bus Stand','Phagwara','+91 1824 260 300','contact@sunriseclinic.in','https://sunriseclinic.in','09:00','19:00',false,'{Cardiology,Orthopaedics,Dermatology,ECG}',true,31.2240,75.7708),
('Lotus Women''s Health Centre','clinic','Gynaecology, prenatal care and fertility counselling by female specialists.','8 Civil Lines','Ludhiana','+91 161 240 7788','care@lotuswomen.in','https://lotuswomen.in','10:00','18:00',false,'{Gynaecology,Prenatal Care,Ultrasound,Fertility Counselling}',true,30.9010,75.8573),
('GreenLeaf Dental Studio','clinic','Modern dental care including implants, aligners and painless root canal treatment.','22 Sector 17 Market','Chandigarh','+91 172 270 4455','smile@greenleafdental.in','https://greenleafdental.in','10:00','20:00',false,'{Dental Cleaning,Implants,Root Canal,Orthodontics}',false,30.7410,76.7821),
('Apex Emergency & Urgent Care','clinic','Round-the-clock urgent care for injuries, fevers and minor procedures.','3 Ferozepur Road','Ludhiana','+91 161 500 2424','urgent@apexcare.in','https://apexcare.in','00:00','23:59',true,'{Emergency Care,Minor Surgery,X-Ray,Ambulance}',true,30.8890,75.8210),
('Harmony Eye Clinic','clinic','Comprehensive eye exams, cataract surgery consultations and contact lens fitting.','17 Mall Road','Amritsar','+91 183 256 9900','eyes@harmonyeye.in',NULL,'09:30','18:30',false,'{Eye Exams,Cataract Consult,Contact Lenses,Glaucoma Screening}',false,31.6340,74.8723),
('PulseHeart Cardiac Clinic','clinic','Dedicated cardiac outpatient clinic with stress testing and Holter monitoring.','90 Lajpat Nagar','Jalandhar','+91 181 222 6060','info@pulseheart.in','https://pulseheart.in','09:00','17:00',false,'{Cardiology,Stress Test,Holter Monitoring,Echo}',true,31.3190,75.5900),
('LabPoint Diagnostics','lab','NABL-accredited lab with home sample collection and digital reports in 6 hours.','5 Nakodar Chowk','Jalandhar','+91 181 460 1234','reports@labpoint.in','https://labpoint.in','07:00','21:00',false,'{Blood Tests,Thyroid Panel,Home Collection,Diabetes Screening}',true,31.3220,75.5680),
('ClearScan Imaging Centre','lab','Advanced imaging including 3T MRI, CT and digital X-ray with radiologist reporting.','33 Sector 34','Chandigarh','+91 172 466 7700','book@clearscan.in','https://clearscan.in','07:00','22:00',false,'{MRI,CT Scan,X-Ray,Ultrasound}',true,30.7230,76.7680),
('Metro Pathology Labs','lab','Full-service pathology lab with 1,200+ tests and corporate health packages.','61 Ghumar Mandi','Ludhiana','+91 161 277 3030','care@metropath.in','https://metropath.in','06:30','20:30',false,'{Blood Tests,Urine Analysis,Lipid Profile,Allergy Testing}',true,30.9120,75.8400),
('QuickTest Collection Point','lab','Neighbourhood collection centre for routine blood and COVID tests.','14 Banga Road','Phagwara','+91 1824 233 455',NULL,NULL,'07:00','14:00',false,'{Blood Tests,COVID RT-PCR,Home Collection}',false,31.2290,75.7650),
('GenomeWise Molecular Lab','lab','Specialised genetic, molecular and oncology testing with counselling support.','2 Industrial Area Phase 1','Chandigarh','+91 172 500 8181','lab@genomewise.in','https://genomewise.in','09:00','18:00',false,'{Genetic Testing,PCR,Oncology Markers,Counselling}',true,30.7050,76.8010),
('Amrit Diagnostic Centre','lab','Trusted diagnostics with ultrasound, ECG and complete health packages.','40 Ranjit Avenue','Amritsar','+91 183 250 1212','amrit@diagnostics.in',NULL,'08:00','20:00',false,'{Ultrasound,ECG,Blood Tests,Health Packages}',false,31.6500,74.8600),
('MediPlus 24x7 Pharmacy','pharmacy','Always-open pharmacy with home delivery and a registered pharmacist on duty.','1 Jyoti Chowk','Jalandhar','+91 181 400 2424','orders@mediplus.in','https://mediplus.in','00:00','23:59',true,'{Prescriptions,Home Delivery,OTC Medicines,Medical Devices}',true,31.3250,75.5790),
('HealthFirst Chemists','pharmacy','Neighbourhood chemist with generic medicine options and free BP checks.','28 Hargobind Nagar','Phagwara','+91 1824 266 101',NULL,NULL,'08:00','22:00',false,'{Prescriptions,Generic Medicines,BP Check}',true,31.2210,75.7740),
('Wellness Pharmacy & Store','pharmacy','Pharmacy plus wellness store stocking supplements, baby care and ayurveda.','77 Sarabha Nagar','Ludhiana','+91 161 245 5858','hello@wellnesspharma.in','https://wellnesspharma.in','09:00','21:30',false,'{Prescriptions,Supplements,Baby Care,Ayurveda}',false,30.8870,75.8050),
('NightOwl Medicos','pharmacy','24-hour pharmacy next to the civil hospital serving emergency prescriptions.','Opp. Civil Hospital','Amritsar','+91 183 222 2400',NULL,NULL,'00:00','23:59',true,'{Prescriptions,Emergency Medicines,Home Delivery}',true,31.6290,74.8780),
('CarePlus Pharmacy','pharmacy','Modern pharmacy with digital prescriptions, refill reminders and diabetic care.','9 Sector 22','Chandigarh','+91 172 270 9090','rx@careplus.in','https://careplus.in','08:00','23:00',false,'{Prescriptions,Refill Reminders,Diabetic Care,Medical Devices}',true,30.7330,76.7720),
('Janta Generic Medical Store','pharmacy','Affordable generic medicines under the Jan Aushadhi scheme.','52 Old Railway Road','Jalandhar','+91 181 223 8877',NULL,NULL,'09:00','20:00',false,'{Generic Medicines,Prescriptions}',false,31.3300,75.5850),
('Lifeline Blood Bank','support','Licensed blood bank with component separation and 24-hour emergency supply.','11 Civil Lines','Ludhiana','+91 161 244 0000','donate@lifelinebb.in','https://lifelinebb.in','00:00','23:59',true,'{Blood Donation,Component Separation,Emergency Supply}',true,30.9040,75.8510),
('MindSpace Counselling Centre','support','Licensed psychologists offering therapy, stress management and teen counselling.','6 Model Town Extension','Jalandhar','+91 181 450 6633','talk@mindspace.in','https://mindspace.in','10:00','19:00',false,'{Counselling,Therapy,Stress Management,Teen Support}',true,31.3150,75.5710),
('StrideRehab Physiotherapy','support','Sports injury rehab, post-surgery physiotherapy and posture correction programmes.','19 Sector 8','Chandigarh','+91 172 274 3322','move@striderehab.in','https://striderehab.in','07:00','20:00',false,'{Physiotherapy,Sports Rehab,Post-Surgery Care,Posture Correction}',true,30.7420,76.7930),
('Saathi Home Nursing','support','Trained nurses and attendants for elderly and post-operative home care.','4 Kitchlu Nagar','Ludhiana','+91 98140 22110','care@saathinursing.in',NULL,'08:00','20:00',false,'{Home Nursing,Elderly Care,Post-Op Care,Attendants}',false,30.9180,75.8300),
('Udaan De-addiction Centre','support','Residential and outpatient de-addiction programmes with family counselling.','Village Chaheru, NH-1','Phagwara','+91 1824 500 700','help@udaancentre.in','https://udaancentre.in','09:00','17:00',false,'{De-addiction,Counselling,Residential Care,Family Support}',true,31.2510,75.7030),
('Ability Diagnostic & Hearing Centre','support','Audiology tests, hearing aids and speech therapy for all ages.','25 Lawrence Road','Amritsar','+91 183 250 4747','hear@abilitycentre.in',NULL,'10:00','18:00',false,'{Hearing Tests,Hearing Aids,Speech Therapy}',false,31.6400,74.8650),
('Red Cross Ambulance Service','support','Emergency and patient transport ambulances with trained paramedics.','Red Cross Bhawan','Jalandhar','+91 181 108 1080',NULL,NULL,'00:00','23:59',true,'{Ambulance,Patient Transport,First Aid Training}',true,31.3280,75.5760),
('Campus Health Centre LPU','clinic','University health centre for students and staff with pharmacy and lab on site.','Lovely Professional University','Phagwara','+91 1824 517 000','health@lpu.co.in','https://lpu.in','08:00','22:00',false,'{General Medicine,First Aid,Pharmacy,Lab Tests}',true,31.2560,75.7050);

INSERT INTO public.feedback (facility_id,user_name,rating,comment,created_at)
SELECT f.id, n.name,
  GREATEST(1, LEAST(5, 5 - ((abs(hashtext(f.name || n.name)) % 7) / 2))),
  n.comment,
  now() - ((abs(hashtext(n.name || f.name)) % 120) || ' days')::interval
FROM public.facilities f
CROSS JOIN (VALUES
 ('Aarav S.','Staff were courteous and the wait time was short. Clear explanation of everything.'),
 ('Priya K.','Clean premises and well organised. Billing was transparent.'),
 ('Rohit M.','Decent experience overall, though parking was a challenge.'),
 ('Simran B.','Very professional. Got my results faster than expected.'),
 ('Karan J.','Helpful at the front desk, but the queue was long on a Monday morning.')
) AS n(name, comment)
WHERE abs(hashtext(f.name || n.name)) % 5 <> 0;