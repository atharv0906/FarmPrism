import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { FarmerStackParamList } from '../navigation/FarmerNavigator';
import type { MyFarmIntent } from '../components/farmer-my-farm/myFarmData';
export function useMyFarmAction() {
  const navigation = useNavigation<NativeStackNavigationProp<FarmerStackParamList>>();
  return (intent: MyFarmIntent) => {
    switch (intent.type) {
      case 'FARM_OVERVIEW': navigation.navigate('FarmOverview'); break;
      case 'EDIT_FARM': navigation.navigate('EditFarm'); break;
      case 'CROPS': navigation.navigate('MyCrops'); break;
      case 'AVAILABLE_PRODUCE': navigation.navigate('AvailableProduce'); break;
      case 'ADD_CROP': navigation.navigate('AddCrop'); break;
      case 'UPDATES': navigation.navigate('FarmActivities'); break;
      case 'MAP': navigation.navigate('FarmLocation'); break;
      case 'CROP_DETAILS': navigation.navigate('CropDetails', { cropKey: intent.cropId }); break;
      case 'BATCHES': navigation.navigate('CropBatches', { cropKey: intent.cropId }); break;
    }
  };
}
