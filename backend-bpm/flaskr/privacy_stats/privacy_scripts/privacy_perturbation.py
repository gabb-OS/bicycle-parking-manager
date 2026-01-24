import matplotlib.pyplot as plt
import numpy as np
from scipy import stats
from scipy.stats import gaussian_kde
import os
from flaskr.extensions import db
from flaskr.models.parking_areas import ParkingArea
from sqlalchemy import func
from geoalchemy2 import Geography


DEFAULT_OUTPUT_DIR = "flaskr/privacy_stats/privacy_plots"

def calculate_privacy_perturbation(output_dir=DEFAULT_OUTPUT_DIR):
    """
    Calculates Privacy Perturbation and returns a structured dictionary containing:
    - 'areas': Detailed data for each area (raw distances + statistics)
    - 'global_stats': Cumulative statistics across all areas
    """
    areas_data = {}
    all_centroid_dists = []
    all_random_dists = []
    
    areas = ParkingArea.query.all()

    for area in areas:
        seed_a = 69
        seed_b = 420 

        # 1. Define simulated parkings and
        simulated_parking_events = func.ST_Dump(func.ST_GeneratePoints(area.location_area, 1000, seed_a)).geom
        random_points_in_area = func.ST_Dump(func.ST_GeneratePoints(area.location_area, 1000, seed_b)).geom
        centroid_in_area = ParkingArea.get_centroid_by_area(area)

        # 2. Query Distances in Meters
        query = db.session.query(
            func.ST_Distance(simulated_parking_events.cast(Geography), centroid_in_area.cast(Geography)),
            func.ST_Distance(simulated_parking_events.cast(Geography), random_points_in_area.cast(Geography))
        )
        rows = query.all()

        d_centroid = [r[0] for r in rows]
        d_random = [r[1] for r in rows]

        # Accumulate for global stats
        all_centroid_dists.extend(d_centroid)
        all_random_dists.extend(d_random)

        # Calculate single area statistics
        stats_centroid = get_statistics(d_centroid)
        stats_random = get_statistics(d_random)

        areas_data[area.id] = {
            "area_id": area.id,
            "metrics": {
                "centroid": {
                    "stats": stats_centroid,
                    "raw_distances": d_centroid
                },
                "random": {
                    "stats": stats_random,
                    "raw_distances": d_random
                }
            }
        }

    # Calculate global statistics
    global_stats = {
        "centroid": get_statistics(all_centroid_dists),
        "random": get_statistics(all_random_dists)
    }

    save_global_stats_to_file(global_stats, output_dir)

    return {
        "areas": areas_data,
        "global_stats": global_stats
    }


################################################################################

def generate_privacy_plots(full_data, output_dir=DEFAULT_OUTPUT_DIR):
    """
    Generates plots.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    plt.switch_backend('Agg')
    print(f"Starting plot generation in: {output_dir}")

    areas_dict = full_data.get('areas', {})
    total_c = []
    total_r = []

    # Plots per area
    for area_id, data in areas_dict.items():
        c_dists = np.array(data['metrics']['centroid']['raw_distances'])
        r_dists = np.array(data['metrics']['random']['raw_distances'])
        
        c_mean = data['metrics']['centroid']['stats']['mean']
        r_mean = data['metrics']['random']['stats']['mean']

        total_c.extend(c_dists)
        total_r.extend(r_dists)

        plt.figure(figsize=(10, 6))
        
        plt.hist(
            [c_dists, r_dists], 
            bins=30, 
            label=[f'Centroid (μ={c_mean}m)', f'Random (μ={r_mean}m)'],
            color=['skyblue', 'salmon'],
            alpha=0.4,
            edgecolor='grey',
            rwidth=1.0
        )

        # KDE Curves
        if len(c_dists) > 1 and len(r_dists) > 1:
            try:
                x_grid = np.linspace(min(c_dists.min(), r_dists.min()), 
                                     max(c_dists.max(), r_dists.max()), 200)
                
                bin_width = (max(c_dists.max(), r_dists.max()) - min(c_dists.min(), r_dists.min())) / 30
                
                kde_c = gaussian_kde(c_dists)
                kde_r = gaussian_kde(r_dists)
                
                plt.plot(x_grid, kde_c(x_grid) * len(c_dists) * bin_width, color='blue', lw=2)
                plt.plot(x_grid, kde_r(x_grid) * len(r_dists) * bin_width, color='red', lw=2)
            except Exception as e:
                print(f"Skip KDE for area {area_id}: {e}")

        plt.title(f'Privacy Perturbation - Area {area_id}')
        plt.xlabel('Distance (m)')
        plt.ylabel('Frequency')
        plt.legend()
        plt.grid(axis='y', alpha=0.3, linestyle='--')
        
        plt.savefig(os.path.join(output_dir, f'privacy_plot_area_{area_id}.png'))
        plt.close()

    # Summary plot
    if total_c and total_r:
        all_c = np.array(total_c)
        all_r = np.array(total_r)
        
        g_mean_c = full_data['global_stats']['centroid']['mean']
        g_mean_r = full_data['global_stats']['random']['mean']
        g_mode_c = full_data['global_stats']['centroid']['mode']
        g_mode_r = full_data['global_stats']['random']['mode']

        plt.figure(figsize=(18, 10))
        
        num_bins = 50
        g_min = min(all_c.min(), all_r.min())
        g_max = max(all_c.max(), all_r.max())
        
        _, bins, _ = plt.hist(
            [all_c, all_r], 
            bins=num_bins, 
            range=(g_min, g_max),
            label=['Centroid Hist', 'Random Hist'],
            color=['skyblue', 'salmon'],
            alpha=0.4, 
            edgecolor='grey',
            rwidth=1.0
        )
        
        try:
            x_grid = np.linspace(g_min, g_max, 500)
            kde_c = gaussian_kde(all_c)
            kde_r = gaussian_kde(all_r)
            bin_width = bins[1] - bins[0]
            
            plt.plot(x_grid, kde_c(x_grid) * len(all_c) * bin_width, color='blue', lw=3, label='Centroid Trend')
            plt.plot(x_grid, kde_r(x_grid) * len(all_r) * bin_width, color='red', lw=3, label='Random Trend')
        except Exception as e:
            print(f"Skip Global KDE: {e}")

        plt.axvline(g_mean_c, color='navy', linestyle='--', lw=2, label=f'Mean C ({g_mean_c}m)')
        plt.axvline(g_mean_r, color='darkred', linestyle='--', lw=2, label=f'Mean R ({g_mean_r}m)')
        
        plt.title(f'SUMMARY (All Areas)')
        plt.xlabel('Distance (meters)')
        plt.ylabel('Frequency (count)')
        plt.legend(loc='upper right')
        plt.grid(axis='y', alpha=0.3, linestyle='--')

        plt.savefig(os.path.join(output_dir, 'privacy_plot_summary.png'))
        plt.close()
        
    return f"Plots and statistics generated in {output_dir}"



def save_global_stats_to_file(global_stats, output_dir):
    """
    Saves global statistics to a text file 'global_stats.txt' in the specified directory.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    stats_file_path = os.path.join(output_dir, "global_stats.txt")
    try:
        with open(stats_file_path, "w") as f:
            f.write("==============================================\n")
            f.write("      GLOBAL PRIVACY PERTURBATION STATS       \n")
            f.write("==============================================\n\n")
            
            # Helper to format output
            def print_stats(method_name, stats_dict):
                f.write(f"--- METHOD: {method_name.upper()} ---\n")
                f.write(f"Mean (Average Distance): {stats_dict['mean']} m\n")
                f.write(f"Median:                  {stats_dict['median']} m\n")
                f.write(f"Mode (Most Frequent):    {stats_dict['mode']} m\n")
                f.write(f"Standard Deviation:      {stats_dict['std_dev']} m\n")
                f.write(f"Min Distance:            {stats_dict['min']} m\n")
                f.write(f"Max Distance:            {stats_dict['max']} m\n")
                f.write("\n")

            if 'centroid' in global_stats:
                print_stats("Centroid", global_stats['centroid'])
            
            if 'random' in global_stats:
                print_stats("Random", global_stats['random'])
                
        print(f"Statistics file saved: {stats_file_path}")
    except Exception as e:
        print(f"Error saving statistics file: {e}")




def get_statistics(distances):
    """
    Calculates statistical metrics from a list of distances.
    """
    if not distances or len(distances) == 0:
        return {
            "mean": 0, "mode": 0, "median": 0, 
            "min": 0, "max": 0, "std_dev": 0
        }

    arr = np.array(distances)
    
    # Mean and Median
    mean_val = np.mean(arr)
    median_val = np.median(arr)
    
    rounded_arr = np.rint(arr)
    mode_result = stats.mode(rounded_arr, keepdims=True)

    mode_val = mode_result.mode[0] if mode_result.count[0] > 0 else 0

    return {
        "mean": float(round(mean_val, 2)),
        "median": float(round(median_val, 2)),
        "mode": float(mode_val),
        "min": float(round(np.min(arr), 2)),
        "max": float(round(np.max(arr), 2)),
        "std_dev": float(round(np.std(arr), 2))
    }