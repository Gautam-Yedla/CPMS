import json
import os
import shutil
from pathlib import Path
from tqdm import tqdm

def coco_to_yolo(coco_json_path, image_dir, output_dir, subset_name):
    # Setup directories
    out_images = os.path.join(output_dir, 'images', subset_name)
    out_labels = os.path.join(output_dir, 'labels', subset_name)
    
    os.makedirs(out_images, exist_ok=True)
    os.makedirs(out_labels, exist_ok=True)
    
    print(f"Processing {subset_name} subset...")
    
    with open(coco_json_path, 'r') as f:
        coco_data = json.load(f)
        
    # Build category mapping
    # Categories might be: empty (id 0?), occupied (id 1?)
    cat_mapping = {}
    for cat in coco_data['categories']:
        # Map 'Space-Empty' to 0 and 'Space-Occupied' / 'occupied' etc to 1
        name = cat['name'].lower()
        if 'empty' in name:
            cat_mapping[cat['id']] = 0
        else:
            cat_mapping[cat['id']] = 1
            
    print(f"Category mapping: {cat_mapping} (derived from: {coco_data['categories']})")
            
    # Group annotations by image_id
    anns_by_img = {}
    for ann in coco_data['annotations']:
        img_id = ann['image_id']
        if img_id not in anns_by_img:
            anns_by_img[img_id] = []
        anns_by_img[img_id].append(ann)
        
    files_processed = 0
        
    for img in tqdm(coco_data['images']):
        img_filename = img['file_name']
        img_id = img['id']
        img_w = img['width']
        img_h = img['height']
        
        src_img_path = os.path.join(image_dir, img_filename)
        dst_img_path = os.path.join(out_images, img_filename)
        
        if not os.path.exists(src_img_path):
            print(f"Skipping missing image: {src_img_path}")
            continue
            
        # Copy image
        shutil.copy(src_img_path, dst_img_path)
        
        # Write YOLO label file
        txt_filename = os.path.splitext(img_filename)[0] + '.txt'
        label_path = os.path.join(out_labels, txt_filename)
        
        with open(label_path, 'w') as f:
            if img_id in anns_by_img:
                for ann in anns_by_img[img_id]:
                    # COCO bbox format: [x_min, y_min, width, height]
                    bbox = ann['bbox']
                    x_min, y_min, w, h = bbox
                    
                    # YOLO format: cls x_center y_center width height (normalized)
                    x_center = (x_min + w / 2) / img_w
                    y_center = (y_min + h / 2) / img_h
                    norm_w = w / img_w
                    norm_h = h / img_h
                    
                    # Clamp to [0, 1] just in case
                    x_center = max(0, min(1, x_center))
                    y_center = max(0, min(1, y_center))
                    norm_w = max(0, min(1, norm_w))
                    norm_h = max(0, min(1, norm_h))
                    
                    cls_id = cat_mapping.get(ann['category_id'], 1)
                    
                    f.write(f"{cls_id} {x_center:.6f} {y_center:.6f} {norm_w:.6f} {norm_h:.6f}\n")
        files_processed += 1
                        
    print(f"Finished {subset_name}. Processed {files_processed} files.")

if __name__ == "__main__":
    kaggle_dir = r"C:\Users\gauta\.cache\kagglehub\datasets\ammarnassanalhajali\pklot-dataset\versions\1"
    output_yolo = r"D:\CPMS\ML\data\pklot_yolo"
    
    os.makedirs(output_yolo, exist_ok=True)
    
    # Write YOLO data.yaml
    yaml_content = f"""
path: D:/CPMS/ML/data/pklot_yolo
train: images/train
val: images/valid
test: images/test

# Classes: 0 is Empty, 1 is Occupied
names:
  0: empty
  1: occupied
"""
    with open(os.path.join(output_yolo, 'data.yaml'), 'w') as f:
        f.write(yaml_content)
    
    # Subsets to process
    subsets = ['train', 'valid', 'test']
    for subset in subsets:
        src_dir = os.path.join(kaggle_dir, subset)
        json_path = os.path.join(src_dir, '_annotations.coco.json')
        
        if os.path.exists(json_path):
            coco_to_yolo(json_path, src_dir, output_yolo, subset)
        else:
            print(f"Could not find annotations for {subset} at {json_path}")
            
    print("All done! Data prepared in D:\\CPMS\\ML\\data\\pklot_yolo")
