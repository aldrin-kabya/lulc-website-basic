@echo OFF
echo.
echo =======================================================
echo LULC Class Tile Generation Script (Robust RGBA Method)
echo =======================================================
echo.

REM Define the input file
SET INPUT_FILE=dhaka_test_gt.tif

REM --- Process Farmland (0, 255, 0) ---
echo Processing Farmland...
REM Step 1: Create an 8-bit mask (values 0 and 255)
gdal_calc.py -A %INPUT_FILE% --A_band=1 -B %INPUT_FILE% --B_band=2 -C %INPUT_FILE% --C_band=3 --outfile=temp_mask.tif --calc="255*((A==0)*(B==255)*(C==0))" --NoDataValue=0
REM Step 2 (THE FIX): Merge the original RGB with the mask as a new Alpha band
gdal_merge.py -separate -o farmland_rgba.tif %INPUT_FILE% temp_mask.tif
REM Step 3: Tile the new 4-band RGBA image
gdal2tiles.py --zoom=8-18 farmland_rgba.tif farmland_tiles
echo.

REM --- Process Water (0, 0, 255) ---
echo Processing Water...
gdal_calc.py -A %INPUT_FILE% --A_band=1 -B %INPUT_FILE% --B_band=2 -C %INPUT_FILE% --C_band=3 --outfile=temp_mask.tif --calc="255*((A==0)*(B==0)*(C==255))" --NoDataValue=0
gdal_merge.py -separate -o water_rgba.tif %INPUT_FILE% temp_mask.tif
gdal2tiles.py --zoom=8-18 water_rgba.tif water_tiles
echo.

REM --- Process Forest (0, 255, 255) ---
echo Processing Forest...
gdal_calc.py -A %INPUT_FILE% --A_band=1 -B %INPUT_FILE% --B_band=2 -C %INPUT_FILE% --C_band=3 --outfile=temp_mask.tif --calc="255*((A==0)*(B==255)*(C==255))" --NoDataValue=0
gdal_merge.py -separate -o forest_rgba.tif %INPUT_FILE% temp_mask.tif
gdal2tiles.py --zoom=8-18 forest_rgba.tif forest_tiles
echo.

REM --- Process Built-Up (255, 0, 0) ---
echo Processing Built-Up...
gdal_calc.py -A %INPUT_FILE% --A_band=1 -B %INPUT_FILE% --B_band=2 -C %INPUT_FILE% --C_band=3 --outfile=temp_mask.tif --calc="255*((A==255)*(B==0)*(C==0))" --NoDataValue=0
gdal_merge.py -separate -o built-up_rgba.tif %INPUT_FILE% temp_mask.tif
gdal2tiles.py --zoom=8-18 built-up_rgba.tif built-up_tiles
echo.

REM --- Process Meadow (255, 255, 0) ---
echo Processing Meadow...
gdal_calc.py -A %INPUT_FILE% --A_band=1 -B %INPUT_FILE% --B_band=2 -C %INPUT_FILE% --C_band=3 --outfile=temp_mask.tif --calc="255*((A==255)*(B==255)*(C==0))" --NoDataValue=0
gdal_merge.py -separate -o meadow_rgba.tif %INPUT_FILE% temp_mask.tif
gdal2tiles.py --zoom=8-18 meadow_rgba.tif meadow_tiles
echo.

REM --- Cleanup intermediate files ---
echo Cleaning up temporary files...
del temp_mask.tif
del farmland_rgba.tif
del water_rgba.tif
del forest_rgba.tif
del built-up_rgba.tif
del meadow_rgba.tif
echo.
echo =======================================================
echo All classes processed successfully!
echo =======================================================
pause