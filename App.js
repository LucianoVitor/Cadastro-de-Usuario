// ============================================================
//  APP.JS — Cadastro de Usuário com Stack + Drawer + Tabs
//  Compatível com Snack Expo (Expo SDK 51+)
// ============================================================

import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, Platform, Animated,
  Dimensions, StatusBar, Modal, FlatList,
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator }   from '@react-navigation/stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Checkbox from 'expo-checkbox';

// ─── Paleta & tokens ────────────────────────────────────────
const C = {
  bg:        '#F0F4FF',
  surface:   '#FFFFFF',
  primary:   '#3B5BDB',
  primaryDk: '#2F4AC0',
  accent:    '#F03E3E',
  text:      '#1A1A2E',
  textSoft:  '#5C6078',
  border:    '#D0D7F5',
  success:   '#2F9E44',
  tab:       '#E8EDFF',
};

const { width } = Dimensions.get('window');

// ─── Navegadores ────────────────────────────────────────────
const Stack  = createStackNavigator();
const Drawer = createDrawerNavigator();
const Tabs   = createBottomTabNavigator();

// ============================================================
//  CONTEXTO GLOBAL DO FORMULÁRIO
// ============================================================
const FormContext = React.createContext(null);

function FormProvider({ children }) {
  const [form, setForm] = useState({
    nome:      '',
    email:     '',
    telefone:  '',
    estado:    '',
    genero:    '',
    tipoConta: '',
    aceito:    false,
    categoria: '',
    obs:       '',
  });
  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  return (
    <FormContext.Provider value={{ form, update }}>
      {children}
    </FormContext.Provider>
  );
}

// ============================================================
//  COMPONENTES REUTILIZÁVEIS
// ============================================================

// --- Título de seção com linha decorativa ---
function SectionTitle({ label }) {
  return (
    <View style={s.sectionTitleRow}>
      <View style={s.sectionLine} />
      <Text style={s.sectionLabel}>{label}</Text>
      <View style={s.sectionLine} />
    </View>
  );
}

// --- Frame (cartão com borda) ---
function Frame({ title, children }) {
  return (
    <View style={s.frame}>
      {title ? <Text style={s.frameTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

// --- Picker customizado com Modal (compatível com Snack/iOS/Web) ---
function SelectPicker({ label, value, options, onSelect, placeholder }) {
  const [visible, setVisible] = useState(false);
  const selected = options.find(o => o.value === value);
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TouchableOpacity
        style={[s.input, s.selectBtn, !selected && { borderColor: C.border }]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[s.selectBtnText, !selected && { color: C.textSoft }]}>
          {selected ? selected.label : (placeholder ?? 'Selecione...')}
        </Text>
        <Text style={s.selectArrow}>▾</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={s.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={item => item.value}
              style={s.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[s.modalItem, item.value === value && s.modalItemActive]}
                  onPress={() => { onSelect(item.value); setVisible(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[s.modalItemText, item.value === value && s.modalItemTextActive]}>
                    {item.label}
                  </Text>
                  {item.value === value && <Text style={s.modalCheck}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// --- Campo de texto estilizado ---
function Field({ label, value, onChangeText, placeholder, keyboardType, multiline }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={[s.input, focused && s.inputFocused, multiline && s.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? `Digite ${label.toLowerCase()}`}
        placeholderTextColor={C.textSoft}
        keyboardType={keyboardType ?? 'default'}
        multiline={!!multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

// --- RadioButton customizado ---
function RadioGroup({ label, options, selected, onSelect }) {
  return (
    <View style={s.radioWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.radioRow}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={s.radioItem}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.7}
          >
            <View style={[s.radioOuter, selected === opt.value && s.radioOuterActive]}>
              {selected === opt.value && <View style={s.radioDot} />}
            </View>
            <Text style={s.radioLabel}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// --- Botão principal ---
function PrimaryButton({ label, onPress, icon }) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,    duration: 80, useNativeDriver: true }),
    ]).start(() => onPress());
  };
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity style={s.btn} onPress={press} activeOpacity={0.85}>
        <Text style={s.btnText}>{icon ? `${icon}  ` : ''}{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================================
//  TELA — HOME
// ============================================================
function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={s.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={s.centerContent}>

        <View style={s.heroBox}>
          <Text style={s.heroIcon}>👤</Text>
          <Text style={s.heroTitle}>Cadastro de{'\n'}Usuário</Text>
          <Text style={s.heroSub}>
            Preencha seus dados em poucos passos e{'\n'}comece a usar o app hoje mesmo.
          </Text>
        </View>

        <Frame title="Como funciona?">
          {[
            { n: '1', t: 'Dados Pessoais', d: 'Nome, e-mail, telefone e localização.' },
            { n: '2', t: 'Preferências',   d: 'Gênero, tipo de conta e observações.' },
            { n: '3', t: 'Revisão',        d: 'Confira tudo e confirme o cadastro.' },
          ].map(item => (
            <View key={item.n} style={s.stepRow}>
              <View style={s.stepBadge}><Text style={s.stepNum}>{item.n}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.stepTitle}>{item.t}</Text>
                <Text style={s.stepDesc}>{item.d}</Text>
              </View>
            </View>
          ))}
        </Frame>

        <PrimaryButton
          label="Iniciar Cadastro"
          icon="✏️"
          onPress={() => navigation.navigate('Formulário de Cadastro')}
        />

      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
//  TELA — DADOS PESSOAIS (Tab 1)
// ============================================================
const ESTADOS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO',
];

function DadosPessoaisScreen() {
  const { form, update } = React.useContext(FormContext);
  return (
    <ScrollView style={s.tabScroll} contentContainerStyle={s.tabContent}>

      <Frame title="Identificação">
        <Field label="Nome completo *" value={form.nome} onChangeText={v => update('nome', v)} />
        <Field label="E-mail *" value={form.email} onChangeText={v => update('email', v)} keyboardType="email-address" />
        <Field label="Telefone *" value={form.telefone} onChangeText={v => update('telefone', v)} keyboardType="phone-pad" />
      </Frame>

      <Frame title="Localização">
        <SelectPicker
          label="Estado *"
          value={form.estado}
          placeholder="Selecione o estado..."
          options={ESTADOS.map(uf => ({ label: uf, value: uf }))}
          onSelect={v => update('estado', v)}
        />
      </Frame>

      <Frame title="Gênero">
        <RadioGroup
          label="Selecione *"
          options={[
            { label: 'Masculino',    value: 'masculino'    },
            { label: 'Feminino',     value: 'feminino'     },
            { label: 'Não-binário',  value: 'nao-binario'  },
            { label: 'Prefiro não dizer', value: 'nao-dizer' },
          ]}
          selected={form.genero}
          onSelect={v => update('genero', v)}
        />
      </Frame>

    </ScrollView>
  );
}

// ============================================================
//  TELA — PREFERÊNCIAS (Tab 2)
// ============================================================
const CATEGORIAS = ['Estudante','Profissional','Empresa','Autônomo','Outros'];

function PreferenciasScreen({ navigation }) {
  const { form, update } = React.useContext(FormContext);

  function validar() {
    const { nome, email, telefone, estado, genero, tipoConta, aceito, categoria } = form;
    if (!nome.trim())        return 'Preencha o Nome completo.';
    if (!email.trim())       return 'Preencha o E-mail.';
    if (!/\S+@\S+\.\S+/.test(email)) return 'E-mail inválido.';
    if (!telefone.trim())    return 'Preencha o Telefone.';
    if (!estado)             return 'Selecione o Estado.';
    if (!genero)             return 'Selecione o Gênero.';
    if (!tipoConta)          return 'Selecione o Tipo de conta.';
    if (!categoria)          return 'Selecione a Categoria.';
    if (!aceito)             return 'Aceite os Termos de Uso.';
    return null;
  }

  function handleEnviar() {
    const err = validar();
    if (err) {
      Alert.alert('Campo obrigatório', err, [{ text: 'OK' }]);
      return;
    }
    navigation.navigate('Resumo');
  }

  return (
    <ScrollView style={s.tabScroll} contentContainerStyle={s.tabContent}>

      <Frame title="Tipo de conta">
        <RadioGroup
          label="Selecione *"
          options={[
            { label: 'Pessoal',  value: 'pessoal'  },
            { label: 'Business', value: 'business' },
          ]}
          selected={form.tipoConta}
          onSelect={v => update('tipoConta', v)}
        />
      </Frame>

      <Frame title="Categoria">
        <SelectPicker
          label="Categoria *"
          value={form.categoria}
          placeholder="Selecione..."
          options={CATEGORIAS.map(c => ({ label: c, value: c }))}
          onSelect={v => update('categoria', v)}
        />
      </Frame>

      <Frame title="Observações">
        <Field
          label="Observações adicionais"
          value={form.obs}
          onChangeText={v => update('obs', v)}
          placeholder="Escreva qualquer informação relevante..."
          multiline
        />
      </Frame>

      <Frame title="Termos de Uso">
        <TouchableOpacity
          style={s.checkRow}
          onPress={() => update('aceito', !form.aceito)}
          activeOpacity={0.7}
        >
          <Checkbox
            value={form.aceito}
            onValueChange={v => update('aceito', v)}
            color={form.aceito ? C.primary : undefined}
            style={s.checkbox}
          />
          <Text style={s.checkLabel}>
            Li e aceito os{' '}
            <Text style={s.checkLink}>Termos de Uso</Text>
            {' '}e a{' '}
            <Text style={s.checkLink}>Política de Privacidade</Text>. *
          </Text>
        </TouchableOpacity>
      </Frame>

      <PrimaryButton label="Enviar Cadastro" icon="🚀" onPress={handleEnviar} />
      <View style={{ height: 32 }} />

    </ScrollView>
  );
}

// ============================================================
//  NAVEGADOR — TABS (dentro do Formulário)
// ============================================================
function FormularioTabs({ navigation }) {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: s.tabBar,
        tabBarActiveTintColor:   C.primary,
        tabBarInactiveTintColor: C.textSoft,
        tabBarLabelStyle: s.tabLabel,
        tabBarIcon: ({ focused }) => {
          const icons = { 'Dados Pessoais': '👤', Preferências: '⚙️' };
          return (
            <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.45 }}>
              {icons[route.name]}
            </Text>
          );
        },
      })}
    >
      <Tabs.Screen name="Dados Pessoais" component={DadosPessoaisScreen} />
      <Tabs.Screen
        name="Preferências"
        children={() => <PreferenciasScreen navigation={navigation} />}
      />
    </Tabs.Navigator>
  );
}

// ============================================================
//  TELA — RESUMO DOS DADOS
// ============================================================
function ResumoRow({ label, value }) {
  if (!value) return null;
  return (
    <View style={s.resumoRow}>
      <Text style={s.resumoLabel}>{label}</Text>
      <Text style={s.resumoValue}>{value}</Text>
    </View>
  );
}

function ResumoScreen({ navigation }) {
  const { form, update } = React.useContext(FormContext);
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacAnim  = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.timing(opacAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  function reiniciar() {
    ['nome','email','telefone','estado','genero','tipoConta','aceito','categoria','obs']
      .forEach(k => update(k, k === 'aceito' ? false : ''));
    navigation.navigate('Formulário de Cadastro');
  }

  return (
    <SafeAreaView style={s.safeArea}>
      <ScrollView contentContainerStyle={s.centerContent}>

        <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacAnim }}>
          <View style={s.successBadge}>
            <Text style={s.successIcon}>✅</Text>
            <Text style={s.successTitle}>Cadastro Realizado!</Text>
            <Text style={s.successSub}>Aqui está um resumo dos seus dados.</Text>
          </View>
        </Animated.View>

        <Frame title="Dados Pessoais">
          <ResumoRow label="Nome"     value={form.nome} />
          <ResumoRow label="E-mail"   value={form.email} />
          <ResumoRow label="Telefone" value={form.telefone} />
          <ResumoRow label="Estado"   value={form.estado} />
          <ResumoRow label="Gênero"   value={form.genero} />
        </Frame>

        <Frame title="Preferências">
          <ResumoRow label="Tipo de conta" value={form.tipoConta} />
          <ResumoRow label="Categoria"     value={form.categoria} />
          <ResumoRow label="Termos aceitos" value={form.aceito ? '✅ Sim' : '❌ Não'} />
          {form.obs ? <ResumoRow label="Observações" value={form.obs} /> : null}
        </Frame>

        <PrimaryButton label="Novo Cadastro" icon="🔄" onPress={reiniciar} />
        <View style={{ height: 32 }} />

      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
//  STACK — Formulário + Resumo
// ============================================================
function FormularioStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle:      { backgroundColor: C.primary, elevation: 0, shadowOpacity: 0 },
        headerTintColor:  '#FFF',
        headerTitleStyle: { fontWeight: '700', fontSize: 17, letterSpacing: 0.3 },
        cardStyle:        { backgroundColor: C.bg },
      }}
    >
      <Stack.Screen
        name="Formulário de Cadastro"
        component={FormularioTabs}
        options={{ title: 'Formulário de Cadastro' }}
      />
      <Stack.Screen
        name="Resumo"
        component={ResumoScreen}
        options={{ title: 'Resumo do Cadastro' }}
      />
    </Stack.Navigator>
  );
}

// ============================================================
//  TELA — SOBRE O APP
// ============================================================
function SobreScreen() {
  return (
    <SafeAreaView style={s.safeArea}>
      <ScrollView contentContainerStyle={s.centerContent}>

        <View style={s.heroBox}>
          <Text style={s.heroIcon}>ℹ️</Text>
          <Text style={s.heroTitle}>Sobre o App</Text>
        </View>

        <Frame title="Tecnologias">
          {[
            ['React Native',     'Framework principal'],
            ['Expo Snack',       'Ambiente de execução'],
            ['React Navigation', 'Stack · Drawer · Tabs'],
            ['expo-checkbox',    'Componente de checkbox'],
            ['@rn-picker/picker','Seletor nativo'],
          ].map(([lib, desc]) => (
            <View key={lib} style={s.techRow}>
              <View style={s.techDot} />
              <View>
                <Text style={s.techLib}>{lib}</Text>
                <Text style={s.techDesc}>{desc}</Text>
              </View>
            </View>
          ))}
        </Frame>

        <Frame title="Navegação integrada">
          <Text style={s.sobreText}>
            Este app demonstra três tipos de navegação encadeados:{'\n\n'}
            • <Text style={{ fontWeight: '700' }}>Drawer</Text> — menu lateral com as seções principais.{'\n'}
            • <Text style={{ fontWeight: '700' }}>Bottom Tabs</Text> — abas dentro do formulário.{'\n'}
            • <Text style={{ fontWeight: '700' }}>Stack</Text> — transição entre formulário e resumo.
          </Text>
        </Frame>

        <View style={s.badge}>
          <Text style={s.badgeText}>Versão 1.0.0  •  SDK 51</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
//  DRAWER CONTENT CUSTOMIZADO
// ============================================================
function CustomDrawerContent(props) {
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <View style={s.drawerHeader}>
        <Text style={s.drawerAvatar}>👤</Text>
        <Text style={s.drawerTitle}>Cadastro App</Text>
        <Text style={s.drawerSub}>React Navigation Demo</Text>
      </View>
      <View style={s.drawerDivider} />
      <DrawerItemList {...props} />
      <View style={{ flex: 1 }} />
      <Text style={s.drawerFooter}>© 2025 — Snack Expo Demo</Text>
    </DrawerContentScrollView>
  );
}

// ============================================================
//  DRAWER — NAVEGADOR PRINCIPAL
// ============================================================
function DrawerNav() {
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle:        { backgroundColor: C.primary, elevation: 0, shadowOpacity: 0 },
        headerTintColor:    '#FFF',
        headerTitleStyle:   { fontWeight: '700', fontSize: 18 },
        drawerStyle:        { backgroundColor: C.surface, width: 270 },
        drawerActiveTintColor:   C.primary,
        drawerInactiveTintColor: C.textSoft,
        drawerActiveBackgroundColor: C.tab,
        drawerLabelStyle:   { fontWeight: '600', fontSize: 15, marginLeft: -8 },
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Home', drawerIcon: () => <Text>🏠</Text> }}
      />
      <Drawer.Screen
        name="Formulário de Cadastro"
        component={FormularioStack}
        options={{ headerShown: false, drawerIcon: () => <Text>📋</Text> }}
      />
      <Drawer.Screen
        name="Sobre o App"
        component={SobreScreen}
        options={{ title: 'Sobre o App', drawerIcon: () => <Text>ℹ️</Text> }}
      />
    </Drawer.Navigator>
  );
}

// ============================================================
//  ROOT
// ============================================================
export default function App() {
  return (
    <FormProvider>
      <NavigationContainer>
        <DrawerNav />
      </NavigationContainer>
    </FormProvider>
  );
}

// ============================================================
//  ESTILOS
// ============================================================
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  centerContent: { padding: 20, paddingBottom: 40 },

  // Hero
  heroBox: { alignItems: 'center', marginBottom: 28, paddingTop: 12 },
  heroIcon: { fontSize: 54, marginBottom: 12 },
  heroTitle: { fontSize: 30, fontWeight: '800', color: C.text, textAlign: 'center', lineHeight: 36, letterSpacing: -0.5 },
  heroSub:   { marginTop: 10, fontSize: 14, color: C.textSoft, textAlign: 'center', lineHeight: 20 },

  // Steps
  stepRow:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  stepBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2 },
  stepNum:   { color: '#FFF', fontWeight: '800', fontSize: 13 },
  stepTitle: { fontWeight: '700', color: C.text, fontSize: 14 },
  stepDesc:  { color: C.textSoft, fontSize: 12, marginTop: 2 },

  // Frame
  frame: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#3B5BDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  frameTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: C.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },

  // Section title
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  sectionLine:     { flex: 1, height: 1, backgroundColor: C.border },
  sectionLabel:    { marginHorizontal: 10, fontSize: 11, color: C.textSoft, fontWeight: '600', letterSpacing: 0.8 },

  // Field
  fieldWrap:  { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: C.textSoft, marginBottom: 6, letterSpacing: 0.3 },
  input: {
    borderWidth: 1.5, borderColor: C.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15, color: C.text, backgroundColor: C.bg,
  },
  inputFocused: { borderColor: C.primary, backgroundColor: '#F5F8FF' },
  inputMulti:   { height: 100 },

  // SelectPicker customizado
  selectBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 10 },
  selectBtnText:   { fontSize: 15, color: C.text, flex: 1 },
  selectArrow:     { fontSize: 16, color: C.primary, marginLeft: 8 },

  // Modal Picker
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  modalBox:        { backgroundColor: C.surface, borderRadius: 16, overflow: 'hidden', maxHeight: 420,
                     shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  modalHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                     padding: 16, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.bg },
  modalTitle:      { fontSize: 14, fontWeight: '800', color: C.primary, letterSpacing: 0.5, textTransform: 'uppercase' },
  modalClose:      { fontSize: 16, color: C.textSoft, paddingHorizontal: 4 },
  modalList:       { maxHeight: 340 },
  modalItem:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                     paddingVertical: 14, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: C.border },
  modalItemActive: { backgroundColor: C.tab },
  modalItemText:   { fontSize: 15, color: C.text },
  modalItemTextActive: { color: C.primary, fontWeight: '700' },
  modalCheck:      { fontSize: 16, color: C.primary, fontWeight: '700' },

  // Radio
  radioWrap: { marginBottom: 8 },
  radioRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  radioItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12, marginBottom: 6 },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', marginRight: 6,
  },
  radioOuterActive: { borderColor: C.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },
  radioLabel: { fontSize: 13, color: C.text },

  // Checkbox
  checkRow:  { flexDirection: 'row', alignItems: 'flex-start' },
  checkbox:  { marginRight: 10, marginTop: 2 },
  checkLabel: { flex: 1, fontSize: 13, color: C.text, lineHeight: 20 },
  checkLink:  { color: C.primary, fontWeight: '700', textDecorationLine: 'underline' },

  // Button
  btn: {
    backgroundColor: C.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },

  // Tabs
  tabScroll: { flex: 1, backgroundColor: C.bg },
  tabContent: { padding: 16, paddingBottom: 32 },
  tabBar: {
    backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border,
    height: 60, paddingBottom: 6, paddingTop: 6,
  },
  tabLabel: { fontSize: 11, fontWeight: '700' },

  // Resumo
  resumoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  resumoLabel: { fontSize: 12, color: C.textSoft, fontWeight: '600', flex: 1 },
  resumoValue: { fontSize: 13, color: C.text, fontWeight: '700', flex: 2, textAlign: 'right' },

  // Success
  successBadge: {
    alignItems: 'center', backgroundColor: C.surface,
    borderRadius: 20, padding: 24, marginBottom: 20,
    borderWidth: 2, borderColor: C.success,
    shadowColor: C.success, shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4,
  },
  successIcon:  { fontSize: 52, marginBottom: 10 },
  successTitle: { fontSize: 24, fontWeight: '800', color: C.success },
  successSub:   { color: C.textSoft, marginTop: 6, fontSize: 13, textAlign: 'center' },

  // Drawer
  drawerHeader:  { padding: 24, paddingTop: 48, backgroundColor: C.primary },
  drawerAvatar:  { fontSize: 44, marginBottom: 8 },
  drawerTitle:   { fontSize: 18, fontWeight: '800', color: '#FFF' },
  drawerSub:     { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  drawerDivider: { height: 1, backgroundColor: C.border, marginVertical: 8 },
  drawerFooter:  { textAlign: 'center', color: C.textSoft, fontSize: 11, padding: 16 },

  // Sobre
  sobreText: { fontSize: 13, color: C.text, lineHeight: 22 },
  techRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  techDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary, marginRight: 12 },
  techLib:   { fontWeight: '700', color: C.text, fontSize: 13 },
  techDesc:  { color: C.textSoft, fontSize: 12 },
  badge:     { alignSelf: 'center', backgroundColor: C.tab, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginTop: 8 },
  badgeText: { color: C.primary, fontWeight: '700', fontSize: 12 },
});
