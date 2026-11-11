"""Spend the mobile triangle budget on articulated legs; keep the fur untouched."""
import bpy

def reduce_details(meshes,body):
    ratios={'Cat eyes':1.,'Soft eye catchlight':1.,'Small rose nose':.80,'Sepia facial detail':.60,'Warm cream whiskers':.60}
    for obj in meshes:
        if obj==body:continue
        old=len(obj.data.polygons)
        if ratios[obj.name]==1.:continue
        for o in bpy.context.selected_objects:o.select_set(False)
        obj.select_set(True);bpy.context.view_layer.objects.active=obj
        reference=obj.copy();reference.data=obj.data.copy();bpy.context.scene.collection.objects.link(reference);reference.hide_render=True
        decimate=obj.modifiers.new('Walk mobile detail budget','DECIMATE');decimate.ratio=ratios[obj.name];decimate.use_collapse_triangulate=True
        bpy.ops.object.modifier_apply(modifier=decimate.name)
        normals=obj.modifiers.new('Retain approved soft shading','DATA_TRANSFER');normals.object=reference;normals.use_loop_data=True;normals.data_types_loops={'CUSTOM_NORMAL'};normals.loop_mapping='POLYINTERP_NEAREST'
        bpy.ops.object.modifier_apply(modifier=normals.name)
        bpy.data.objects.remove(reference,do_unlink=True)
        print('DETAIL_BUDGET',obj.name,old,len(obj.data.polygons),flush=True)
