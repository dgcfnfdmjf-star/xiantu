"""Display-only Blender cat hooks, applied after V9.4 feedback without editing the V5 upload."""

replace('    kittens.push(k);\n    return k;', '    kittens.push(k);\n    if (window.GardenCatModels) window.GardenCatModels.attach(k);\n    return k;')
replace('  function removeKitten(k) {\n    k.dead = true;', '  function removeKitten(k) {\n    k.dead = true;\n    if (window.GardenCatModels) window.GardenCatModels.remove(k);')
replace('    group.visible = two;', '    group.visible = two;\n    if (window.GardenCatModels) window.GardenCatModels.setLevel(n, kittens);')
replace('    k.x = wx; k.z = wz;\n    resolve(k);', '    k.x = wx; k.z = wz;\n    if (window.GardenCatModels) window.GardenCatModels.prepareWalk(k, dt);\n    resolve(k);')
replace('    k.moving = true;\n', '    k.moving = true;\n    k.catWalkSpeed = speed; // Display-only cadence; movement keeps the original speed.\n')
replace('    k.root.scale.set(sc, sc, sc);\n    k.inner.scale.y', '    k.root.scale.set(sc, sc, sc);\n    if (window.GardenCatModels && window.GardenCatModels.pose(k, t, dt)) return;\n    k.inner.scale.y')
replace('      k.root.getWorldPosition(tmp2); tmp2.y += 0.3;\n', '      if (window.GardenCatModels) window.GardenCatModels.hitPoint(k, tmp2);\n      else { k.root.getWorldPosition(tmp2); tmp2.y += 0.3; }\n')
replace('      k.root.getWorldPosition(tmp2); tmp2.y += 0.3; tmp2.project(H.camera);', '      if (window.GardenCatModels) window.GardenCatModels.hitPoint(k, tmp2);\n      else { k.root.getWorldPosition(tmp2); tmp2.y += 0.3; }\n      tmp2.project(H.camera);')

# The ambient cat uses the same orange template, original hit proxy and pet/sleep state.
replace("    hitProxy(root, 0.55, 0.25, { kind: 'cat' });\n    H.island.add(root);", "    hitProxy(root, 0.55, 0.25, { kind: 'cat' });\n    H.island.add(root);\n    if (window.GardenCatModels) window.GardenCatModels.registerAmbient(cat);")
replace('    cat.head.getWorldPosition(tmp);', '    if (window.GardenCatModels) window.GardenCatModels.ambientHead(cat, tmp);\n    else cat.head.getWorldPosition(tmp);')
replace('    cat.tail.rotation.z = k * (0.6 + Math.sin(t * 4) * 0.35);', '    cat.tail.rotation.z = k * (0.6 + Math.sin(t * 4) * 0.35);\n    if (window.GardenCatModels) window.GardenCatModels.poseAmbient(cat, t);')
