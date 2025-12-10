import pandas as pd
import json
import os
from datetime import datetime

def excel_to_json(excel_path, json_path):
    # 确保输出目录存在
    os.makedirs(os.path.dirname(json_path), exist_ok=True)
    
    try:
        # 检查Excel文件是否存在
        if not os.path.exists(excel_path):
            print(f"警告：Excel文件不存在: {excel_path}")
            # 创建空的JSON文件
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump([], f, ensure_ascii=False, indent=2)
            return
        
        # 读取Excel文件
        df = pd.read_excel(excel_path)
        print(f"成功读取Excel文件: {excel_path}, 共{len(df)}行数据")
        
        # 转换为字典列表
        data = []
        for index, row in df.iterrows():
            # 跳过空行
            if pd.isna(row.get('filename', '')):
                continue
                
            item = {
                'filename': str(row['filename']),
                'keywords': [kw.strip() for kw in str(row.get('keywords', '')).split(',') if kw.strip()],
                'text_content': str(row.get('text_content', '')),
                'last_updated': datetime.now().isoformat()
            }
            
            # 添加可选字段
            if 'category' in df.columns and not pd.isna(row.get('category')):
                item['category'] = str(row['category'])
            if 'song_name' in df.columns and not pd.isna(row.get('song_name')):
                item['song_name'] = str(row['song_name'])
                
            data.append(item)
        
        # 保存为JSON
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"成功生成JSON文件: {json_path}, 包含{len(data)}条记录")
        
    except Exception as e:
        print(f"处理文件时出错: {excel_path} -> {e}")
        # 创建空的JSON文件作为回退
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump([], f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(__file__))
    data_dir = os.path.join(base_dir, 'data')
    
    print("开始转换Excel到JSON...")
    
    # 处理单技数据
    excel_to_json(
        os.path.join(data_dir, 'excel', 'single_skill.xlsx'),
        os.path.join(data_dir, 'json', 'single_skill.json')
    )
    
    # 处理Call本数据
    excel_to_json(
        os.path.join(data_dir, 'excel', 'call_book.xlsx'),
        os.path.join(data_dir, 'json', 'call_book.json')
    )
    
    print("转换完成！")