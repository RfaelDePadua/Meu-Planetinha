# Gera a ilustração de um planeta do Meu Planetinha no estilo "massinha 3D"
# (mesmo jeito de midia/planet-calculon.png e planet-letrion.png).
# Uso: blender --background --factory-startup --python planeta.py -- <naturox|terramund|globish> saida.png [amostras]
import bpy, bmesh, math, random, sys
from mathutils import Vector, Quaternion, Euler

argv = sys.argv[sys.argv.index('--') + 1:]
NOME = argv[0]
SAIDA = argv[1]
AMOSTRAS = int(argv[2]) if len(argv) > 2 else 96
random.seed({'naturox': 7, 'terramund': 11, 'globish': 23}[NOME])

R = 1.0  # raio do planeta

# ── Cena ─────────────────────────────────────────────
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
cena = bpy.context.scene
cena.render.engine = 'CYCLES'
cena.cycles.samples = AMOSTRAS
cena.cycles.use_denoising = True
cena.render.resolution_x = 512
cena.render.resolution_y = 512
cena.render.film_transparent = True
cena.render.image_settings.file_format = 'PNG'
cena.render.image_settings.color_mode = 'RGBA'
try:
    cena.view_settings.view_transform = 'Standard'
    cena.view_settings.look = 'None'
except Exception:
    pass

mundo = bpy.data.worlds.new('mundo')
cena.world = mundo
mundo.use_nodes = True
fundo = mundo.node_tree.nodes['Background']
fundo.inputs[0].default_value = (0.85, 0.88, 0.95, 1)
fundo.inputs[1].default_value = 0.35

colecao = cena.collection


def hexcor(h, a=1.0):
    h = h.lstrip('#')
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return (lin[0], lin[1], lin[2], a)


_mats = {}


def mat(h, rug=0.55, brilho=0.0):
    chave = (h, rug, brilho)
    if chave in _mats:
        return _mats[chave]
    m = bpy.data.materials.new('m' + h)
    m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = hexcor(h)
    p.inputs['Roughness'].default_value = rug
    if 'Coat Weight' in p.inputs:
        p.inputs['Coat Weight'].default_value = brilho
    _mats[chave] = m
    return m


def objeto(nome, malha, material, pai=None, loc=(0, 0, 0), rot=(0, 0, 0), esc=(1, 1, 1), suave=True):
    for poly in malha.polygons:
        poly.use_smooth = suave
    o = bpy.data.objects.new(nome, malha)
    colecao.objects.link(o)
    if material:
        o.data.materials.append(material)
    o.parent = pai
    o.location = loc
    o.rotation_euler = rot
    o.scale = esc
    return o


def esfera(raio=1.0, seg=32, aneis=16):
    me = bpy.data.meshes.new('esfera')
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=aneis, radius=raio)
    bm.to_mesh(me)
    bm.free()
    return me


def cone(r1, r2, alt, seg=32):
    me = bpy.data.meshes.new('cone')
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r1, radius2=r2, depth=alt)
    bmesh.ops.translate(bm, vec=(0, 0, alt / 2), verts=bm.verts)
    bm.to_mesh(me)
    bm.free()
    return me


def cubo(t=1.0):
    me = bpy.data.meshes.new('cubo')
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=t)
    bm.to_mesh(me)
    bm.free()
    return me


def arredondar(o, largura=0.02, segs=4):
    b = o.modifiers.new('bevel', 'BEVEL')
    b.width = largura
    b.segments = segs
    b.limit_method = 'NONE'
    return o


def toro(r_maior, r_menor, material, pai=None, loc=(0, 0, 0), rot=(0, 0, 0), esc=(1, 1, 1)):
    bpy.ops.mesh.primitive_torus_add(major_radius=r_maior, minor_radius=r_menor, major_segments=64, minor_segments=16)
    o = bpy.context.active_object
    for poly in o.data.polygons:
        poly.use_smooth = True
    o.data.materials.append(material)
    o.parent = pai
    o.location = loc
    o.rotation_euler = rot
    o.scale = esc
    return o


def texto(corpo, tamanho, material, pai=None, loc=(0, 0, 0), rot=(0, 0, 0), extrusao=0.02):
    cu = bpy.data.curves.new('txt', 'FONT')
    cu.body = corpo
    cu.size = tamanho
    cu.extrude = extrusao
    cu.bevel_depth = extrusao * 0.4
    cu.align_x = 'CENTER'
    cu.align_y = 'CENTER'
    o = bpy.data.objects.new('txt', cu)
    colecao.objects.link(o)
    o.data.materials.append(material)
    o.parent = pai
    o.location = loc
    o.rotation_euler = rot
    return o


def ancora(direcao, altura=0.0, giro=0.0, inclina=0.0):
    """Empty na superfície do planeta, com Z apontando para fora."""
    d = Vector(direcao).normalized()
    e = bpy.data.objects.new('ancora', None)
    colecao.objects.link(e)
    e.location = d * (R + altura)
    e.rotation_mode = 'QUATERNION'
    q = Vector((0, 0, 1)).rotation_difference(d)
    q = q @ Quaternion((0, 0, 1), giro)
    if inclina:
        q = q @ Quaternion((1, 0, 0), inclina)
    e.rotation_quaternion = q
    return e


def dir_esf(lat, lon):
    """lat/lon em graus; lon 0 = de frente para a câmera (−Y)."""
    la, lo = math.radians(lat), math.radians(lon)
    return Vector((math.cos(la) * math.sin(lo), -math.cos(la) * math.cos(lo), math.sin(la)))


# ── Planeta: esfera "massinha" marmorizada com faixas ─────────
def planeta(cores, faixa, escala_marmore=2.2, escala_faixas=1.6, relevo=0.035, rampa_custom=None, distorcao=2.6, detalhe=6):
    me = esfera(R, 96, 48)
    o = objeto('planeta', me, None)
    sub = o.modifiers.new('sub', 'SUBSURF')
    sub.levels = 1
    sub.render_levels = 2
    tex = bpy.data.textures.new('massa', 'CLOUDS')
    tex.noise_scale = 0.45
    dis = o.modifiers.new('desloca', 'DISPLACE')
    dis.texture = tex
    dis.strength = relevo
    dis.mid_level = 0.5

    m = bpy.data.materials.new('planeta')
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes['Principled BSDF']
    p.inputs['Roughness'].default_value = 0.62
    coord = nt.nodes.new('ShaderNodeTexCoord')
    ruido = nt.nodes.new('ShaderNodeTexNoise')
    ruido.inputs['Scale'].default_value = escala_marmore
    ruido.inputs['Detail'].default_value = detalhe
    ruido.inputs['Distortion'].default_value = distorcao
    onda = nt.nodes.new('ShaderNodeTexWave')
    onda.wave_type = 'BANDS'
    onda.bands_direction = 'Z'
    onda.inputs['Scale'].default_value = escala_faixas
    onda.inputs['Distortion'].default_value = 5.0
    onda.inputs['Detail'].default_value = 3
    rampa = nt.nodes.new('ShaderNodeValToRGB')
    el = rampa.color_ramp.elements
    if rampa_custom:
        el[0].position, el[0].color = rampa_custom[0][0], hexcor(rampa_custom[0][1])
        el[1].position, el[1].color = rampa_custom[-1][0], hexcor(rampa_custom[-1][1])
        for pos, c in rampa_custom[1:-1]:
            el.new(pos).color = hexcor(c)
    else:
        el[0].position = 0.25
        el[0].color = hexcor(cores[0])
        el[1].position = 0.75
        el[1].color = hexcor(cores[1])
        for i, c in enumerate(cores[2:]):
            novo = el.new(0.5 + 0.1 * i)
            novo.color = hexcor(c)
    nt.links.new(coord.outputs['Object'], ruido.inputs['Vector'])
    nt.links.new(coord.outputs['Object'], onda.inputs['Vector'])
    nt.links.new(ruido.outputs['Fac'], rampa.inputs['Fac'])
    # faixas claras por cima do mármore
    rampa_faixa = nt.nodes.new('ShaderNodeValToRGB')
    ef = rampa_faixa.color_ramp.elements
    ef[0].position = 0.89
    ef[0].color = (0, 0, 0, 1)
    ef[1].position = 0.925
    ef[1].color = (1, 1, 1, 1)
    nt.links.new(onda.outputs['Fac'], rampa_faixa.inputs['Fac'])
    if faixa:
        mistura = nt.nodes.new('ShaderNodeMix')
        mistura.data_type = 'RGBA'
        nt.links.new(rampa_faixa.outputs['Color'], mistura.inputs['Factor'])
        nt.links.new(rampa.outputs['Color'], mistura.inputs[6])
        mistura.inputs[7].default_value = hexcor(faixa)
        nt.links.new(mistura.outputs[2], p.inputs['Base Color'])
    else:
        nt.links.new(rampa.outputs['Color'], p.inputs['Base Color'])
    # relevo fino de massinha
    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.25
    nt.links.new(ruido.outputs['Fac'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], p.inputs['Normal'])
    o.data.materials.append(m)
    return o


# ── Peças ─────────────────────────────────────────────
VERDES = ['#1F9D55', '#36B37E', '#65C83E', '#2E8B57']


def arvore(d, escala=1.0, copa=None):
    a = ancora(d, -0.01, random.uniform(0, 6.28))
    objeto('tronco', cone(0.035 * escala, 0.028 * escala, 0.16 * escala), mat('#8B5A2B', 0.7), a)
    c = copa or random.choice(VERDES)
    for (x, y, z, r) in [(0, 0, 0.2, 0.11), (0.06, 0.02, 0.15, 0.08), (-0.05, -0.03, 0.16, 0.085)]:
        objeto('copa', esfera(r * escala, 24, 12), mat(c, 0.6), a, (x * escala, y * escala, z * escala))
    return a


def pinheiro(d, escala=1.0):
    a = ancora(d, -0.01, random.uniform(0, 6.28))
    objeto('tronco', cone(0.03 * escala, 0.025 * escala, 0.08 * escala), mat('#8B5A2B', 0.7), a)
    for i, (r, z) in enumerate([(0.11, 0.06), (0.085, 0.13), (0.06, 0.19)]):
        objeto('folhas', cone(r * escala, 0.0, 0.12 * escala), mat('#1E9E5A', 0.6), a, (0, 0, z * escala))
    return a


def cogumelo(d, escala=1.0, cor='#E8433A'):
    a = ancora(d, -0.005, random.uniform(0, 6.28), random.uniform(-0.25, 0.25))
    objeto('pe', cone(0.028 * escala, 0.024 * escala, 0.08 * escala), mat('#FFF1D6', 0.6), a)
    chapeu = objeto('chapeu', esfera(0.065 * escala, 24, 12), mat(cor, 0.5), a, (0, 0, 0.085 * escala), esc=(1, 1, 0.6))
    for k in range(5):
        ang = k * 1.256 + 0.3
        objeto('pinta', esfera(0.012 * escala, 12, 6), mat('#FFFFFF', 0.5), a,
               (math.cos(ang) * 0.04 * escala, math.sin(ang) * 0.04 * escala, 0.115 * escala))
    return a


def flor(d, escala=1.0, cor='#FF6FA8'):
    a = ancora(d, 0.0, random.uniform(0, 6.28))
    objeto('caule', cone(0.008 * escala, 0.008 * escala, 0.07 * escala), mat('#2FBF71'), a)
    objeto('miolo', esfera(0.022 * escala, 16, 8), mat('#FFD43B', 0.5), a, (0, 0, 0.08 * escala))
    for k in range(5):
        ang = k * 1.2566
        objeto('petala', esfera(0.025 * escala, 16, 8), mat(cor, 0.5), a,
               (math.cos(ang) * 0.035 * escala, math.sin(ang) * 0.035 * escala, 0.078 * escala), esc=(1, 1, 0.5))
    return a


def folha(d, cor=None):
    a = ancora(d, 0.006, random.uniform(0, 6.28))
    objeto('folha', esfera(0.05, 16, 8), mat(cor or random.choice(VERDES), 0.55), a, esc=(1, 0.45, 0.18))
    return a


def pedra(d, escala=1.0):
    a = ancora(d, -0.01, random.uniform(0, 6.28))
    me = bpy.data.meshes.new('pedra')
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.05 * escala)
    for v in bm.verts:
        v.co *= random.uniform(0.85, 1.1)
    bm.to_mesh(me)
    bm.free()
    objeto('pedra', me, mat('#9AA5B1', 0.8), a, esc=(1, 0.9, 0.6))
    return a


def confete(d, cor, forma='bola'):
    a = ancora(d, 0.008, random.uniform(0, 6.28), random.uniform(-0.5, 0.5))
    if forma == 'bola':
        objeto('c', esfera(0.018, 12, 6), mat(cor, 0.45), a)
    elif forma == 'piramide':
        objeto('c', cone(0.03, 0.0, 0.045, 4), mat(cor, 0.45), a, suave=False)
    elif forma == 'cubo':
        arredondar(objeto('c', cubo(0.04), mat(cor, 0.45), a, suave=False), 0.006, 2)
    return a


def montanha(d, escala=1.0, cor='#8D6E63'):
    a = ancora(d, -0.02, random.uniform(0, 6.28))
    objeto('monte', cone(0.13 * escala, 0.01 * escala, 0.2 * escala, 7), mat(cor, 0.7), a, suave=False)
    objeto('neve', cone(0.055 * escala, 0.0, 0.085 * escala, 7), mat('#FFFFFF', 0.6), a, (0, 0, 0.13 * escala), suave=False)
    return a


def alfinete(d, cor='#E8433A', escala=1.0):
    a = ancora(d, 0.0, 0.0, random.uniform(-0.2, 0.2))
    objeto('ponta', cone(0.004 * escala, 0.022 * escala, 0.09 * escala), mat('#C9CED6', 0.3), a)
    objeto('cabeca', esfera(0.04 * escala, 24, 12), mat(cor, 0.35, 0.3), a, (0, 0, 0.11 * escala))
    return a


def rosa_dos_ventos(d, escala=1.0, giro=0.0):
    a = ancora(d, 0.0, giro)
    objeto('pe', cone(0.03 * escala, 0.03 * escala, 0.12 * escala), mat('#8B5A2B', 0.6), a)
    base = objeto('disco', cone(0.2 * escala, 0.2 * escala, 0.04 * escala, 48), mat('#FFF1D6', 0.5), a, (0, 0, 0.12 * escala), rot=(math.radians(70), 0, 0))
    toro(0.2 * escala, 0.018 * escala, mat('#D4622A', 0.45), base, (0, 0, 0.04 * escala))
    # agulha: losangos vermelho (N) e branco (S)
    for sinal, cor in ((1, '#E8433A'), (-1, '#5B6B7F')):
        objeto('agulha', cone(0.035 * escala, 0.0, 0.15 * escala, 4), mat(cor, 0.4), base,
               (0, 0, 0.05 * escala), rot=(math.radians(-90 * sinal), 0, 0), esc=(1, 0.35, 1), suave=False)
    for i, letra in enumerate('NLSO'):
        ang = math.radians(90 - i * 90)
        texto(letra, 0.07 * escala, mat('#11173A', 0.5), base,
              (math.cos(ang) * 0.14 * escala, math.sin(ang) * 0.14 * escala, 0.045 * escala), extrusao=0.006)
    return a


def bloco(d, letra, cor, escala=1.0, giro=0.0, inclina=0.0):
    a = ancora(d, 0.035 * escala, giro, inclina)
    c = arredondar(objeto('bloco', cubo(0.075 * escala), mat(cor, 0.5), a, suave=False), 0.01 * escala, 3)
    texto(letra, 0.06 * escala, mat('#FFFFFF', 0.5), a, (0, -0.039 * escala, 0), rot=(math.radians(90), 0, 0), extrusao=0.005)
    return a


def balao(d, fala, cor, escala=1.0, giro=0.0, altura=0.25):
    a = ancora(d, altura, giro)
    corpo = arredondar(objeto('balao', cubo(1.0), mat('#FFFFFF', 0.45), a, esc=(0.26 * escala, 0.06 * escala, 0.15 * escala), suave=False), 0.25, 6)
    objeto('rabinho', cone(0.035 * escala, 0.0, 0.08 * escala, 3), mat('#FFFFFF', 0.45), a, (-0.06 * escala, 0, -0.1 * escala), rot=(math.radians(180), 0, 0), suave=False)
    texto(fala, 0.085 * escala, mat(cor, 0.4), a, (0, -0.032 * escala, 0), rot=(math.radians(90), 0, 0), extrusao=0.01)
    return a


def balao_livre(pos, fala, cor, escala=1.0, giro=0.0):
    a = bpy.data.objects.new('balao', None)
    colecao.objects.link(a)
    a.location = pos
    a.rotation_euler = (math.radians(-12), 0, giro)
    arredondar(objeto('balao', cubo(1.0), mat('#FFFFFF', 0.45), a, esc=(0.26 * escala, 0.07 * escala, 0.15 * escala), suave=False), 0.25, 6)
    objeto('rabinho', cone(0.04 * escala, 0.0, 0.09 * escala, 3), mat('#FFFFFF', 0.45), a, (-0.06 * escala, 0, -0.1 * escala), rot=(math.radians(180), 0, 0), suave=False)
    texto(fala, 0.09 * escala, mat(cor, 0.4), a, (0, -0.037 * escala, 0.005 * escala), rot=(math.radians(90), 0, 0), extrusao=0.012)
    return a


def bloco_livre(pos, letra, cor, escala=1.0, giro=0.0):
    a = bpy.data.objects.new('bloco', None)
    colecao.objects.link(a)
    a.location = pos
    a.rotation_euler = (0, 0, giro)
    arredondar(objeto('bloco', cubo(0.075 * escala), mat(cor, 0.5), a, suave=False), 0.01 * escala, 3)
    texto(letra, 0.06 * escala, mat('#FFFFFF', 0.5), a, (0, -0.039 * escala, 0), rot=(math.radians(90), 0, 0), extrusao=0.005)
    return a


def nota_musical(d, cor, escala=1.0):
    a = ancora(d, 0.02, random.uniform(-0.4, 0.4))
    objeto('cabeca', esfera(0.03 * escala, 16, 8), mat(cor, 0.4), a, esc=(1.2, 0.8, 0.8))
    objeto('haste', cone(0.006 * escala, 0.006 * escala, 0.12 * escala), mat(cor, 0.4), a, (0.03 * escala, 0, 0))
    return a


def fone(escala=1.0):
    """Fone de ouvido abraçando o planeta (o 'ouvir' do Listen & Do)."""
    cor = '#FF7A59'
    raio = R + 0.1
    cu = bpy.data.curves.new('arco', 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = 0.085
    cu.bevel_resolution = 6
    sp = cu.splines.new('POLY')
    pts = []
    for i in range(41):
        t = math.radians(-70 + 140 * i / 40)
        pts.append((math.sin(t) * raio, 0.15, math.cos(t) * raio))
    sp.points.add(len(pts) - 1)
    for p, (x, y, z) in zip(sp.points, pts):
        p.co = (x, y, z, 1)
    arco = bpy.data.objects.new('arco', cu)
    colecao.objects.link(arco)
    arco.data.materials.append(mat(cor, 0.4, 0.2))
    for lado in (-1, 1):
        t = math.radians(70)
        cx, cz = math.sin(t) * raio * lado, math.cos(t) * raio
        conc = objeto('concha', cone(0.24, 0.22, 0.14, 48), mat(cor, 0.4, 0.2), None,
                      (cx * 1.02, 0.12, cz * 0.6), rot=(0, math.radians(90 * lado) - math.radians(20 * lado), 0))
        toro(0.2, 0.05, mat('#11173A', 0.6), conc, (0, 0, -0.0))
    return arco


def anel(cor_anel, inclinacao=(math.radians(72), math.radians(-14), 0)):
    toro(1.42, 0.05, mat(cor_anel, 0.5), None, rot=inclinacao, esc=(1, 1, 0.55))


# ── Os três planetas ───────────────────────────────────
if NOME == 'naturox':
    planeta(['#0E7A45', '#4DFFB4', '#1FBF7A'], '#F1FFF7', 1.6, 0.9)
    # bosque no topo
    for (lat, lon, esc) in [(78, -10, 1.15), (70, 25, 0.95), (72, -40, 1.0), (62, 5, 0.8), (88, 120, 1.0)]:
        arvore(dir_esf(lat, lon), esc * 1.35)
    pinheiro(dir_esf(66, -62), 1.1)
    pinheiro(dir_esf(60, 48), 0.9)
    cogumelo(dir_esf(55, -20), 1.6)
    cogumelo(dir_esf(48, 24), 1.3, '#FF8C42')
    for i in range(14):
        flor(dir_esf(random.uniform(-55, 45), random.uniform(-80, 80)), random.uniform(1.0, 1.35),
             random.choice(['#FF6FA8', '#FFD43B', '#B48CFF', '#FFFFFF']))
    for i in range(22):
        folha(dir_esf(random.uniform(-70, 50), random.uniform(-85, 85)))
    for i in range(6):
        pedra(dir_esf(random.uniform(-60, 40), random.uniform(-80, 80)), random.uniform(0.6, 1.0))
    for i in range(40):
        confete(dir_esf(random.uniform(-80, 60), random.uniform(-90, 90)),
                random.choice(['#FFD43B', '#FF6FA8', '#67E8F9', '#FFFFFF', '#B48CFF']), random.choice(['bola', 'piramide']))

elif NOME == 'terramund':
    planeta([], None, 1.25, 0.9, rampa_custom=[(0.0, '#2F7FCF'), (0.44, '#4FA3E0'), (0.47, '#F7D08A'), (0.5, '#D4622A'), (0.62, '#E88A56'), (0.7, '#5DBB63'), (1.0, '#3C9A4A')], distorcao=0.5, detalhe=3)
    rosa_dos_ventos(dir_esf(80, 0), 1.25, math.radians(10))
    for (lat, lon, esc) in [(60, -45, 1.1), (55, -20, 0.8), (62, 40, 1.0), (48, 58, 0.75)]:
        montanha(dir_esf(lat, lon), esc)
    for (lat, lon, cor) in [(20, -30, '#E8433A'), (-10, 25, '#FFD43B'), (35, 18, '#4DFFB4'), (-35, -15, '#E8433A')]:
        alfinete(dir_esf(lat, lon), cor)
    for i in range(10):
        pinheiro(dir_esf(random.uniform(-50, 40), random.uniform(-80, 80)), random.uniform(0.45, 0.7))
    for i in range(36):
        confete(dir_esf(random.uniform(-80, 60), random.uniform(-90, 90)),
                random.choice(['#FFD43B', '#4FA3E0', '#FFFFFF', '#4DFFB4', '#E8433A']), random.choice(['bola', 'piramide', 'cubo']))

elif NOME == 'globish':
    planeta(['#006F80', '#3FE3F2', '#00B5CC'], '#FFFFFF', 1.6, 0.9)
    fone()
    balao_livre((-0.62, -0.95, 0.55), 'Hi!', '#FF7A59', 1.6, math.radians(10))
    balao_livre((0.6, -0.95, 0.2), 'Hello', '#2B6CE4', 1.75, math.radians(-10))
    for (x, letra, cor, giro) in [(-0.17, 'A', '#E8433A', -12), (0.0, 'B', '#2B6CE4', 4), (0.17, 'C', '#FFB000', 14)]:
        bloco_livre((x, -0.2, R + 0.06 - abs(x) * 0.12), letra, cor, 2.0, math.radians(giro))
    for i in range(7):
        nota_musical(dir_esf(random.uniform(-40, 40), random.uniform(-70, 70)),
                     random.choice(['#FF7A59', '#2B6CE4', '#FFB000', '#B48CFF']), random.uniform(0.8, 1.1))
    for i in range(44):
        confete(dir_esf(random.uniform(-80, 65), random.uniform(-90, 90)),
                random.choice(['#FFD43B', '#FF7A59', '#FFFFFF', '#2B6CE4', '#B48CFF']), random.choice(['bola', 'piramide', 'cubo']))

# ── Luzes e câmera ─────────────────────────────────────
def luz(nome, loc, energia, tamanho, cor=(1, 1, 1)):
    l = bpy.data.lights.new(nome, 'AREA')
    l.energy = energia
    l.size = tamanho
    l.color = cor
    o = bpy.data.objects.new(nome, l)
    colecao.objects.link(o)
    o.location = loc
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = Vector((0, 0, -1)).rotation_difference((-Vector(loc)).normalized())
    return o

luz('chave', (-3.5, -4.5, 5.0), 650, 4.0, (1.0, 0.97, 0.92))
luz('preenchimento', (4.5, -3.5, 1.0), 200, 5.0, (0.9, 0.95, 1.0))
luz('contorno', (1.5, 5.0, 3.5), 500, 3.0)

cam = bpy.data.cameras.new('cam')
cam.lens = 100
camo = bpy.data.objects.new('cam', cam)
colecao.objects.link(camo)
camo.location = (0, -8.2, 2.6)
alvo = Vector((0, 0, 0.12))
camo.rotation_mode = 'QUATERNION'
camo.rotation_quaternion = (alvo - camo.location).to_track_quat('-Z', 'Y')
cena.camera = camo

cena.render.filepath = SAIDA
bpy.ops.render.render(write_still=True)
print('ok', SAIDA)
